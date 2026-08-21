-- Migration 08: system_logs (gap-fill #2) + audit wiring
--
-- No audit/log table exists anywhere in the ERD despite System Logs
-- (src/app/admin/logs/page.tsx) being a full screen and a stated
-- functional requirement. Two write paths populate it, both bypassing RLS
-- by running as SECURITY DEFINER functions owned by the table owner (no
-- INSERT policy is granted to `authenticated` at all — this table is
-- append-only via these sanctioned paths, never directly writable):
--
--   1. audit_log_trigger() — attached to items/deliveries/releases/users,
--      fires automatically on create/update/delete.
--   2. log_login() / log_action() RPCs — for events with no natural table
--      trigger (login; ad-hoc actions like "exported a report"). The
--      login page should call log_login() right after a successful
--      signInWithPassword().

create table if not exists public.system_logs (
  log_id      bigint generated always as identity primary key,
  user_id     uuid references public.users (id),
  action      public.log_action not null,
  module      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_system_logs_created_at on public.system_logs (created_at desc);
create index if not exists idx_system_logs_user_id on public.system_logs (user_id);

alter table public.system_logs enable row level security;

-- "View system logs" is Admin-only per the Use Case diagram. No insert/
-- update/delete policy exists for `authenticated` — writes only happen
-- via the SECURITY DEFINER paths below.
create policy system_logs_select_admin on public.system_logs
  for select to authenticated using (public.has_permission('View system logs'));

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action      public.log_action;
  v_module      text;
  v_description text;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  end if;

  v_module := case tg_table_name
    when 'items' then 'Inventory'
    when 'deliveries' then 'Deliveries'
    when 'releases' then 'Releases / RIS'
    when 'users' then 'Users'
    else tg_table_name
  end;

  v_description := case tg_table_name
    when 'items' then tg_op || ' item ' || coalesce(new.item_code, old.item_code)
    when 'deliveries' then tg_op || ' delivery ' || coalesce(new.ref_no, old.ref_no)
    when 'releases' then tg_op || ' RIS/request ' || coalesce(new.ris_number, old.ris_number)
    when 'users' then tg_op || ' user ' || coalesce(new.full_name, old.full_name)
    else tg_op || ' on ' || tg_table_name
  end;

  insert into public.system_logs (user_id, action, module, description)
  values (auth.uid(), v_action, v_module, v_description);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_items on public.items;
create trigger trg_audit_items
  after insert or update or delete on public.items
  for each row execute function public.audit_log_trigger();

drop trigger if exists trg_audit_deliveries on public.deliveries;
create trigger trg_audit_deliveries
  after insert or update or delete on public.deliveries
  for each row execute function public.audit_log_trigger();

drop trigger if exists trg_audit_releases on public.releases;
create trigger trg_audit_releases
  after insert or update or delete on public.releases
  for each row execute function public.audit_log_trigger();

drop trigger if exists trg_audit_users on public.users;
create trigger trg_audit_users
  after insert or update or delete on public.users
  for each row execute function public.audit_log_trigger();

-- ---------------------------------------------------------------------
-- Manual logging RPCs (login + ad-hoc events not covered by a table
-- trigger). Called from the client after a successful action, e.g. the
-- login page calls log_login() right after supabase.auth.signInWithPassword.
-- ---------------------------------------------------------------------

create or replace function public.log_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.system_logs (user_id, action, module, description)
  values (auth.uid(), 'login', 'Auth', 'User logged in successfully');
end;
$$;

grant execute on function public.log_login() to authenticated;

create or replace function public.log_action(p_action public.log_action, p_module text, p_description text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.system_logs (user_id, action, module, description)
  values (auth.uid(), p_action, p_module, p_description);
end;
$$;

grant execute on function public.log_action(public.log_action, text, text) to authenticated;
