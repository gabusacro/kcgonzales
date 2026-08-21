-- Migration 02: roles + role_permissions (gap-fill #1)
--
-- The ERD (Figure 3.4) has a bare `role` ENUM on Users, but the Manage Roles
-- screen (src/app/admin/roles/page.tsx) lets an admin create roles and
-- toggle a permissions matrix per role — that needs real tables. role_id on
-- users (added in migration 03) replaces the ENUM.
--
-- Mutation policies (admin-only) are added in migration 03, once the
-- is_admin() helper function exists — see that file for why.

create table if not exists public.roles (
  role_id     bigint generated always as identity primary key,
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id        bigint not null references public.roles (role_id) on delete cascade,
  permission_key text not null,
  allowed        boolean not null default false,
  primary key (role_id, permission_key)
);

alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;

-- Role names/descriptions and the permission matrix are not sensitive —
-- every signed-in user can read them (useful for client-side nav
-- show/hide too). Mutations are locked down in migration 03.
create policy roles_select_all on public.roles
  for select to authenticated using (true);

create policy role_permissions_select_all on public.role_permissions
  for select to authenticated using (true);
