-- Migration 06: releases (RIS) + release_items (gap-fill #4)
--
-- The thesis prose treats "Requests" (Faculty/Staff) and "Releases/RIS"
-- (Officer-processed) as separate entities, but the ERD diagram (Figure
-- 3.4) only has ONE RELEASES(RIS) table with both requested_by and
-- approved_by FKs. Per the task brief we follow the diagram: one table,
-- one lifecycle (`status`), covering submission through approval/release.
-- This also matches the existing mock data shape (risRecords + myRequests
-- are just two views over the same kind of record).
--
-- ris_number holds either an Officer-style "RIS-2024-0218" ref or a
-- Faculty/Staff self-service "REQ-0091" ref — same column, same table,
-- just a different naming convention depending on how the row originated.
--
-- department/scio are added columns (gap-fill) — not in the ERD, but the
-- Releases and Request Supplies screens both display them and they're not
-- reliably derivable from requested_by alone (a user's home department can
-- differ from the department a specific request is filed under).

create table if not exists public.releases (
  release_id   bigint generated always as identity primary key,
  ris_number   text not null unique,
  release_date date,
  requested_by uuid not null references public.users (id),
  approved_by  uuid references public.users (id),
  department   text,
  scio         text,
  purpose      text,
  status       public.release_status not null default 'pending',
  remarks      text,
  created_at   timestamptz not null default now()
);

create table if not exists public.release_items (
  release_item_id bigint generated always as identity primary key,
  release_id      bigint not null references public.releases (release_id) on delete cascade,
  item_id         bigint not null references public.items (item_id),
  quantity        numeric not null check (quantity > 0),
  unit_cost       numeric
);

create index if not exists idx_releases_requested_by on public.releases (requested_by);
create index if not exists idx_releases_approved_by on public.releases (approved_by);
create index if not exists idx_releases_status on public.releases (status);
create index if not exists idx_release_items_release_id on public.release_items (release_id);
create index if not exists idx_release_items_item_id on public.release_items (item_id);

alter table public.releases enable row level security;
alter table public.release_items enable row level security;

-- ---------------------------------------------------------------------
-- releases RLS
--   - Officer (has_permission('Process RIS') or 'Approve requests') sees
--     and can act on everything.
--   - Faculty/Staff see and can only touch THEIR OWN rows
--     (requested_by = auth.uid()), and only while still pending.
-- ---------------------------------------------------------------------

create policy releases_select on public.releases
  for select to authenticated
  using (
    public.has_permission('Process RIS')
    or public.has_permission('Approve requests')
    or requested_by = auth.uid()
  );

create policy releases_insert on public.releases
  for insert to authenticated
  with check (
    public.has_permission('Process RIS')
    or (
      public.is_faculty_staff()
      and requested_by = auth.uid()
      and status = 'pending'
      and approved_by is null
    )
  );

create policy releases_update on public.releases
  for update to authenticated
  using (
    public.has_permission('Process RIS')
    or public.has_permission('Approve requests')
    or (requested_by = auth.uid() and status = 'pending')
  )
  with check (
    public.has_permission('Process RIS')
    or public.has_permission('Approve requests')
    or (
      requested_by = auth.uid()
      and status in ('pending', 'rejected')
      and approved_by is null
    )
  );

create policy releases_delete on public.releases
  for delete to authenticated using (public.has_permission('Process RIS'));

-- release_items: same visibility/ownership shape as the parent release.
create policy release_items_select on public.release_items
  for select to authenticated
  using (
    public.has_permission('Process RIS')
    or public.has_permission('Approve requests')
    or exists (
      select 1 from public.releases r
      where r.release_id = release_items.release_id and r.requested_by = auth.uid()
    )
  );

create policy release_items_insert on public.release_items
  for insert to authenticated
  with check (
    public.has_permission('Process RIS')
    or exists (
      select 1 from public.releases r
      where r.release_id = release_items.release_id
        and r.requested_by = auth.uid()
        and r.status = 'pending'
    )
  );

create policy release_items_update on public.release_items
  for update to authenticated
  using (
    public.has_permission('Process RIS')
    or exists (
      select 1 from public.releases r
      where r.release_id = release_items.release_id
        and r.requested_by = auth.uid()
        and r.status = 'pending'
    )
  )
  with check (
    public.has_permission('Process RIS')
    or exists (
      select 1 from public.releases r
      where r.release_id = release_items.release_id
        and r.requested_by = auth.uid()
        and r.status = 'pending'
    )
  );

create policy release_items_delete on public.release_items
  for delete to authenticated
  using (
    public.has_permission('Process RIS')
    or exists (
      select 1 from public.releases r
      where r.release_id = release_items.release_id
        and r.requested_by = auth.uid()
        and r.status = 'pending'
    )
  );

-- ---------------------------------------------------------------------
-- Automatic stock deduction on approval/release — NOT on insert, since a
-- freshly-submitted Faculty/Staff request must not touch stock until an
-- Officer actually approves it. Reverses the deduction if a
-- previously-approved/released row is walked back to pending/rejected.
-- ---------------------------------------------------------------------

create or replace function public.apply_release_stock_effect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  was_deducted boolean;
  is_deducted  boolean;
begin
  was_deducted := (tg_op = 'UPDATE') and (old.status in ('approved', 'released'));
  is_deducted  := (new.status in ('approved', 'released'));

  if is_deducted and not was_deducted then
    update public.items i
    set stock_quantity = i.stock_quantity - ri.quantity
    from public.release_items ri
    where ri.release_id = new.release_id and i.item_id = ri.item_id;
  elsif was_deducted and not is_deducted then
    update public.items i
    set stock_quantity = i.stock_quantity + ri.quantity
    from public.release_items ri
    where ri.release_id = new.release_id and i.item_id = ri.item_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_releases_stock_effect on public.releases;
create trigger trg_releases_stock_effect
  after insert or update of status on public.releases
  for each row execute function public.apply_release_stock_effect();
