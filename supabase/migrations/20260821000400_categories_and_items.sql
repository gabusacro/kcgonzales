-- Migration 04: categories + items (inventory)
--
-- Note on `items.status`: the ERD gives Items its own status ENUM
-- separate from stock level. We treat it as the item's lifecycle status
-- (active/inactive/discontinued — "do we still carry/track this item"),
-- NOT the OK/Low/Critical stock badge the UI shows. That badge is a pure
-- function of stock_quantity vs reorder_level and is computed in the
-- query layer (src/lib/supabase/queries.ts), not stored, so it can never
-- drift out of sync.
--
-- Categories are placed under "System settings" permission (admin-only
-- mutation) rather than "Manage inventory" (officer) because the existing
-- UI already puts category/unit-of-measure management on the admin-only
-- System Settings screen (src/app/admin/settings/page.tsx) — Officer
-- manages the stock itself, Admin manages the taxonomy/config it's filed
-- under. Flagged in the final report as a judgment call.

create table if not exists public.categories (
  category_id   bigint generated always as identity primary key,
  category_name text not null unique,
  description   text,
  status        public.category_status not null default 'active'
);

create table if not exists public.items (
  item_id        bigint generated always as identity primary key,
  item_code      text not null unique,
  item_name      text not null,
  description    text,
  category_id    bigint references public.categories (category_id),
  unit           text not null,
  stock_quantity numeric not null default 0 check (stock_quantity >= 0),
  reorder_level  numeric not null default 0,
  unit_cost      numeric not null default 0,
  status         public.item_status not null default 'active',
  created_at     timestamptz not null default now()
);

create index if not exists idx_items_category_id on public.items (category_id);

alter table public.categories enable row level security;
alter table public.items enable row level security;

-- categories: everyone can browse (Officer manages stock against them,
-- Faculty/Staff browse to file requests); only System settings can edit.
create policy categories_select_all on public.categories
  for select to authenticated using (true);
create policy categories_insert_admin on public.categories
  for insert to authenticated with check (public.has_permission('System settings'));
create policy categories_update_admin on public.categories
  for update to authenticated
  using (public.has_permission('System settings'))
  with check (public.has_permission('System settings'));
create policy categories_delete_admin on public.categories
  for delete to authenticated using (public.has_permission('System settings'));

-- items: everyone can browse (needed for Request Supplies + Releases
-- item pickers); only "Manage inventory" (Supply Officer) can mutate.
create policy items_select_all on public.items
  for select to authenticated using (true);
create policy items_insert_officer on public.items
  for insert to authenticated with check (public.has_permission('Manage inventory'));
create policy items_update_officer on public.items
  for update to authenticated
  using (public.has_permission('Manage inventory'))
  with check (public.has_permission('Manage inventory'));
create policy items_delete_officer on public.items
  for delete to authenticated using (public.has_permission('Manage inventory'));
