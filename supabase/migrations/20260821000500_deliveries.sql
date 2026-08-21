-- Migration 05: deliveries + delivery_items (gap-fill #3)
--
-- The ERD's DELIVERIES entity has no line-item junction table, but the
-- Record Deliveries screen (src/app/deliveries/page.tsx) needs per-item
-- qty + unit cost within one delivery, exactly like RELEASE_ITEMS does for
-- releases. delivery_items mirrors that shape.
--
-- "Automatic stock updates" (functional requirement) is implemented as an
-- AFTER trigger on delivery_items that bumps items.stock_quantity — a
-- trigger (not an RPC-only transaction) was chosen so the stock effect is
-- guaranteed regardless of which code path inserts the row (direct insert,
-- future RPC, admin SQL fix-up, etc).
--
-- ref_no is the delivery's own display reference (mock UI's "Delivery
-- ref. no.", e.g. DEL-2024-083); po_number is the separate ERD field /
-- the UI's "OR / PO number" input — kept as two distinct fields.

create table if not exists public.deliveries (
  delivery_id   bigint generated always as identity primary key,
  ref_no        text not null unique,
  po_number     text,
  delivery_date date not null,
  supplier      text not null,
  received_by   uuid references public.users (id),
  remarks       text,
  created_at    timestamptz not null default now()
);

create table if not exists public.delivery_items (
  delivery_item_id bigint generated always as identity primary key,
  delivery_id      bigint not null references public.deliveries (delivery_id) on delete cascade,
  item_id          bigint not null references public.items (item_id),
  quantity         numeric not null check (quantity > 0),
  unit_cost        numeric not null default 0
);

create index if not exists idx_deliveries_received_by on public.deliveries (received_by);
create index if not exists idx_delivery_items_delivery_id on public.delivery_items (delivery_id);
create index if not exists idx_delivery_items_item_id on public.delivery_items (item_id);

alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;

-- Deliveries are Officer-only end to end (Admin has no inventory/delivery
-- access per the Use Case diagram; Faculty/Staff never see them).
create policy deliveries_select_officer on public.deliveries
  for select to authenticated using (public.has_permission('Record deliveries'));
create policy deliveries_insert_officer on public.deliveries
  for insert to authenticated with check (public.has_permission('Record deliveries'));
create policy deliveries_update_officer on public.deliveries
  for update to authenticated
  using (public.has_permission('Record deliveries'))
  with check (public.has_permission('Record deliveries'));
create policy deliveries_delete_officer on public.deliveries
  for delete to authenticated using (public.has_permission('Record deliveries'));

create policy delivery_items_select_officer on public.delivery_items
  for select to authenticated using (public.has_permission('Record deliveries'));
create policy delivery_items_insert_officer on public.delivery_items
  for insert to authenticated with check (public.has_permission('Record deliveries'));
create policy delivery_items_update_officer on public.delivery_items
  for update to authenticated
  using (public.has_permission('Record deliveries'))
  with check (public.has_permission('Record deliveries'));
create policy delivery_items_delete_officer on public.delivery_items
  for delete to authenticated using (public.has_permission('Record deliveries'));

-- ---------------------------------------------------------------------
-- Automatic stock bump on delivery receipt.
-- ---------------------------------------------------------------------

create or replace function public.bump_stock_on_delivery_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.items set stock_quantity = stock_quantity + new.quantity
      where item_id = new.item_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.items set stock_quantity = stock_quantity - old.quantity
      where item_id = old.item_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update public.items set stock_quantity = stock_quantity - old.quantity + new.quantity
      where item_id = new.item_id;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_delivery_items_stock_bump on public.delivery_items;
create trigger trg_delivery_items_stock_bump
  after insert or update or delete on public.delivery_items
  for each row execute function public.bump_stock_on_delivery_item();
