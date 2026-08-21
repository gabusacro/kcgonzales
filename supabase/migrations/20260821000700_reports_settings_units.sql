-- Migration 07: reports (ERD) + system_settings/units_of_measure (own
-- additions, needed for the already-built System Settings screen at
-- src/app/admin/settings/page.tsx which has no ERD table of its own).

create table if not exists public.reports (
  report_id    bigint generated always as identity primary key,
  report_type  text not null,
  parameters   text,
  file_path    text,
  generated_by uuid references public.users (id),
  generated_at timestamptz not null default now()
);

create index if not exists idx_reports_generated_by on public.reports (generated_by);

alter table public.reports enable row level security;

-- Reports are an Officer-only capability per the Use Case diagram
-- ("generate reports" is not listed for Admin).
create policy reports_select_officer on public.reports
  for select to authenticated using (public.has_permission('Generate reports'));
create policy reports_insert_officer on public.reports
  for insert to authenticated
  with check (public.has_permission('Generate reports') and generated_by = auth.uid());
create policy reports_update_officer on public.reports
  for update to authenticated
  using (public.has_permission('Generate reports'))
  with check (public.has_permission('Generate reports'));
create policy reports_delete_officer on public.reports
  for delete to authenticated using (public.has_permission('Generate reports'));

-- ---------------------------------------------------------------------
-- system_settings: singleton row backing the "General settings" panel.
-- ---------------------------------------------------------------------

create table if not exists public.system_settings (
  id                          boolean primary key default true,
  institution_name            text,
  system_title                 text,
  fiscal_year_start            text,
  currency                     text,
  low_stock_threshold_percent  numeric,
  updated_at                   timestamptz not null default now(),
  constraint system_settings_singleton check (id)
);

alter table public.system_settings enable row level security;

create policy system_settings_select_all on public.system_settings
  for select to authenticated using (true);
create policy system_settings_update_admin on public.system_settings
  for update to authenticated
  using (public.has_permission('System settings'))
  with check (public.has_permission('System settings'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- units_of_measure: backs the "Units of measure" list on the same screen.
-- ---------------------------------------------------------------------

create table if not exists public.units_of_measure (
  unit_id      bigint generated always as identity primary key,
  name         text not null unique,
  abbreviation text not null
);

alter table public.units_of_measure enable row level security;

create policy units_of_measure_select_all on public.units_of_measure
  for select to authenticated using (true);
create policy units_of_measure_insert_admin on public.units_of_measure
  for insert to authenticated with check (public.has_permission('System settings'));
create policy units_of_measure_update_admin on public.units_of_measure
  for update to authenticated
  using (public.has_permission('System settings'))
  with check (public.has_permission('System settings'));
create policy units_of_measure_delete_admin on public.units_of_measure
  for delete to authenticated using (public.has_permission('System settings'));
