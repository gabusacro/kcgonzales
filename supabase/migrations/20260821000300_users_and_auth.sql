-- Migration 03: public.users profile table + auth wiring + RLS helpers
--
-- public.users mirrors the ERD's USERS entity, minus `password` (Supabase
-- Auth owns credentials in auth.users) and with `role` replaced by role_id
-- (see migration 02). `department` is an added column (gap-fill) — it's not
-- in the ERD but every screen that shows "SCIO / dept." (Manage Users,
-- Releases/RIS) needs it, and Faculty/Staff's own department context is
-- needed for the Request Supplies screen.
--
-- id is the same UUID as auth.users.id (1:1), so RLS can key off auth.uid()
-- directly with no extra join.

create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null unique,
  full_name  text not null,
  email      text not null unique,
  role_id    bigint not null references public.roles (role_id),
  department text,
  status     public.user_status not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role_id on public.users (role_id);

alter table public.users enable row level security;

-- ---------------------------------------------------------------------
-- RLS helper functions
--
-- All SECURITY DEFINER + fixed search_path, owned by the migration role
-- (table owner), so they read public.users/roles/role_permissions
-- bypassing RLS — this is what avoids infinite recursion when a users/
-- roles policy itself calls is_admin()/has_permission().
-- ---------------------------------------------------------------------

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.role_id = u.role_id
  where u.id = auth.uid()
$$;

grant execute on function public.current_role_name() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() = 'Admin'
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() = 'Supply Officer'
$$;

grant execute on function public.is_officer() to authenticated;

create or replace function public.is_faculty_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() = 'Faculty / Staff'
$$;

grant execute on function public.is_faculty_staff() to authenticated;

-- Dynamic permission check against role_permissions, so the Manage Roles
-- screen's toggles have real teeth (including for future custom roles an
-- admin creates), not just cosmetic switches.
create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select rp.allowed
      from public.role_permissions rp
      join public.users u on u.role_id = rp.role_id
      where u.id = auth.uid() and rp.permission_key = perm
    ),
    false
  )
$$;

grant execute on function public.has_permission(text) to authenticated;

-- ---------------------------------------------------------------------
-- users RLS
--   - everyone can read their own profile
--   - Officer can browse users (needed for "received by" / requester
--     display on Deliveries + Releases screens)
--   - Admin has full read/write ("manage users" is admin-only per the Use
--     Case diagram, Figure 3.5)
-- ---------------------------------------------------------------------

create policy users_select on public.users
  for select to authenticated
  using (public.is_admin() or public.is_officer() or id = auth.uid());

create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_admin());

create policy users_update on public.users
  for update to authenticated
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin());

-- Field-level guard: a non-admin updating their own row cannot change
-- their own role_id or status (prevents client-side privilege escalation
-- via the permissive "own row" RLS update policy above). Implemented as a
-- BEFORE trigger rather than fighting RLS's WITH CHECK old/new semantics.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role_id is distinct from old.role_id
      or new.status is distinct from old.status then
      raise exception 'Only an administrator can change role or status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_privilege_escalation on public.users;
create trigger trg_prevent_self_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_self_privilege_escalation();

-- ---------------------------------------------------------------------
-- roles / role_permissions mutation policies (admin-only).
-- Deliberately gated by is_admin() (a role-name check) rather than
-- has_permission('Manage users') — using the permission-matrix itself to
-- protect the permission-matrix table creates a self-lockout risk if an
-- admin ever unchecks their own permission by mistake.
-- ---------------------------------------------------------------------

create policy roles_insert_admin on public.roles
  for insert to authenticated with check (public.is_admin());
create policy roles_update_admin on public.roles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy roles_delete_admin on public.roles
  for delete to authenticated using (public.is_admin());

create policy role_permissions_insert_admin on public.role_permissions
  for insert to authenticated with check (public.is_admin());
create policy role_permissions_update_admin on public.role_permissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy role_permissions_delete_admin on public.role_permissions
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- auth.users -> public.users provisioning trigger
--
-- Standard Supabase pattern (documented at supabase.com/docs/guides/auth/
-- managing-user-data). Reads role_name/username/full_name/department/
-- status out of raw_user_meta_data so both real sign-ups (if ever enabled)
-- and the seed script (migration 09, which inserts into auth.users
-- directly with metadata) get a matching public.users row automatically.
-- Defaults to the 'Faculty / Staff' role when no role_name is supplied —
-- the safe/least-privileged default for anyone who signs up unassisted.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id   bigint;
  v_role_name text;
begin
  v_role_name := coalesce(new.raw_user_meta_data ->> 'role_name', 'Faculty / Staff');

  select role_id into v_role_id from public.roles where name = v_role_name;
  if v_role_id is null then
    select role_id into v_role_id from public.roles where name = 'Faculty / Staff';
  end if;

  insert into public.users (id, username, full_name, email, role_id, department, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    v_role_id,
    new.raw_user_meta_data ->> 'department',
    coalesce(nullif(new.raw_user_meta_data ->> 'status', ''), 'active')::public.user_status
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
