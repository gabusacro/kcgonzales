-- Migration 09: seed data
--
-- Mirrors src/lib/mock-data.ts wherever reasonable (same item codes,
-- categories, delivery/RIS reference numbers, log lines) so Frontend
-- Dev's query-wiring pass has something real to point at.
--
-- *** IMPORTANT / unverified section: seeding auth.users directly ***
-- This migration inserts 4 rows straight into auth.users (with
-- raw_user_meta_data so the on_auth_user_created trigger from migration
-- 03 auto-creates the matching public.users profile). Writing directly to
-- auth.users is a common community pattern for seed scripts but is NOT an
-- officially supported Supabase API, and we have no live/MCP access this
-- round to verify it actually works against this project's exact GoTrue
-- version. If this section errors out, or the accounts exist but can't
-- log in:
--   1. Delete this section (the four `insert into auth.users` statements
--      and their corresponding role/domain seed rows that reference their
--      UUIDs would then need placeholder UUIDs swapped for real ones), OR
--   2. Create the same 4 accounts via Supabase Studio -> Authentication ->
--      Add user (same emails below), which lets GoTrue handle all of its
--      own internal bookkeeping correctly. The handle_new_user trigger
--      will still auto-create their public.users profile (defaulting to
--      the Faculty / Staff role) — then UPDATE role_id/department for the
--      admin & officer accounts by hand.
--
-- Seed password for all 3 login-capable demo accounts (Ramon Santos is
-- seeded INACTIVE and not meant to log in): Ustp@Supply2024
-- Treat this as a throwaway dev credential — rotate or delete these
-- accounts before any real deployment.

-- ---------------------------------------------------------------------
-- 1. Roles + permission matrix
--
-- Values follow the source-verified Use Case Diagram (Figure 3.5) matrix
-- from the task brief, NOT the placeholder src/lib/mock-data.ts
-- `roleDefinitions` (which gives Admin every permission including
-- inventory/deliveries/RIS/reports — that mock was a placeholder for the
-- visual build and contradicts the diagram; Frontend Dev may want to
-- update that mock file to match once they wire up real queries).
-- ---------------------------------------------------------------------

insert into public.roles (name, description) values
  ('Admin', 'Manages users, roles & permissions, system settings, and views system logs'),
  ('Supply Officer', 'Manages inventory, records deliveries, processes RIS, and generates reports'),
  ('Faculty / Staff', 'Requests supplies and views their own request status/history')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_key, allowed)
select r.role_id, p.permission_key, p.allowed
from public.roles r
join (values
  ('Admin', 'Manage inventory', false),
  ('Admin', 'Record deliveries', false),
  ('Admin', 'Process RIS', false),
  ('Admin', 'Generate reports', false),
  ('Admin', 'Manage users', true),
  ('Admin', 'System settings', true),
  ('Admin', 'View system logs', true),
  ('Admin', 'Approve requests', false),

  ('Supply Officer', 'Manage inventory', true),
  ('Supply Officer', 'Record deliveries', true),
  ('Supply Officer', 'Process RIS', true),
  ('Supply Officer', 'Generate reports', true),
  ('Supply Officer', 'Manage users', false),
  ('Supply Officer', 'System settings', false),
  ('Supply Officer', 'View system logs', false),
  ('Supply Officer', 'Approve requests', true),

  ('Faculty / Staff', 'Manage inventory', false),
  ('Faculty / Staff', 'Record deliveries', false),
  ('Faculty / Staff', 'Process RIS', false),
  ('Faculty / Staff', 'Generate reports', false),
  ('Faculty / Staff', 'Manage users', false),
  ('Faculty / Staff', 'System settings', false),
  ('Faculty / Staff', 'View system logs', false),
  ('Faculty / Staff', 'Approve requests', false)
) as p(role_name, permission_key, allowed) on p.role_name = r.name
on conflict (role_id, permission_key) do update set allowed = excluded.allowed;

-- ---------------------------------------------------------------------
-- 2. Demo accounts (auth.users -> public.users via handle_new_user)
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'admin@school.edu.ph',
    crypt('Ustp@Supply2024', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role_name', 'Admin', 'username', 'admin',
      'full_name', 'System Admin', 'department', 'All', 'status', 'active'
    ),
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'jdelacruz@school.edu.ph',
    crypt('Ustp@Supply2024', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role_name', 'Supply Officer', 'username', 'jdelacruz',
      'full_name', 'Juan Dela Cruz', 'department', 'Main Campus', 'status', 'active'
    ),
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'amercado@school.edu.ph',
    crypt('Ustp@Supply2024', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role_name', 'Faculty / Staff', 'username', 'amercado',
      'full_name', 'Ana Mercado', 'department', 'Engineering', 'status', 'active'
    ),
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated', 'rsantos@school.edu.ph',
    crypt('Ustp@Supply2024', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'role_name', 'Faculty / Staff', 'username', 'rsantos',
      'full_name', 'Ramon Santos', 'department', 'Finance', 'status', 'inactive'
    ),
    now(), now()
  )
on conflict (id) do nothing;

-- (Fixed UUIDs are used inline throughout the rest of this file instead of
-- variables, since plain SQL statements can't share a plpgsql variable
-- scope: 10000000-...0001 = admin, ...0002 = officer/Juan Dela Cruz,
-- ...0003 = faculty/Ana Mercado, ...0004 = staff/Ramon Santos.)

-- ---------------------------------------------------------------------
-- 3. Categories + units of measure
-- ---------------------------------------------------------------------

insert into public.categories (category_name, description, status) values
  ('Office Supplies', 'Paper, writing, and general office consumables', 'active'),
  ('Janitorial', 'Cleaning supplies and consumables', 'active'),
  ('Medical', 'First-aid and clinic consumables', 'active'),
  ('Electrical', 'Wiring, extension cords, and electrical consumables', 'inactive'),
  ('IT Supplies', 'Printer and computer consumables', 'active')
on conflict (category_name) do nothing;

insert into public.units_of_measure (name, abbreviation) values
  ('Piece', 'pc'),
  ('Ream', 'rm'),
  ('Box', 'bx'),
  ('Bottle', 'btl'),
  ('Pack', 'pk')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 4. Items — seeded with the CURRENT on-hand quantity from
-- src/lib/mock-data.ts `inventoryItems` directly (not replayed through
-- the delivery/release triggers below — see section 5's note).
-- ---------------------------------------------------------------------

insert into public.items (item_code, item_name, description, category_id, unit, stock_quantity, reorder_level, unit_cost, status)
select v.item_code, v.item_name, null, c.category_id, v.unit, v.stock_quantity, v.reorder_level, v.unit_cost, 'active'
from (values
  ('ITM-0041', 'Bond Paper A4',        'Office Supplies', 'Ream', 3,  10, 220),
  ('ITM-0055', 'Correction Fluid',     'Office Supplies', 'Pc',   7,  15, 45),
  ('ITM-0067', 'Staple Wire',          'Office Supplies', 'Box',  22, 10, 65),
  ('ITM-0089', 'Broom (Soft)',         'Janitorial',      'Pc',   2,  5,  150),
  ('ITM-0102', 'Alcohol 70%',          'Medical',         'Bottle', 18, 20, 55),
  ('ITM-0117', 'Extension Cord 3m',    'Electrical',      'Pc',   3,  5,  180),
  ('ITM-0124', 'Bond Paper Short',     'Office Supplies', 'Ream', 41, 15, 210),
  ('ITM-0139', 'Trash Bag (Large)',    'Janitorial',      'Pack', 9,  12, 95),
  ('ITM-0201', 'Ballpen (Black)',      'Office Supplies', 'Pc',   60, 20, 8),
  ('ITM-0202', 'Whiteboard Markers',   'Office Supplies', 'Pc',   24, 10, 35),
  ('ITM-0203', 'Ink Cartridge (Black)','IT Supplies',     'Pc',   5,  5,  650)
) as v(item_code, item_name, category_name, unit, stock_quantity, reorder_level, unit_cost)
join public.categories c on c.category_name = v.category_name
on conflict (item_code) do nothing;

-- ---------------------------------------------------------------------
-- 5. Deliveries + releases — historical records for the UI lists.
--
-- The stock-affecting triggers (bump_stock_on_delivery_item,
-- apply_release_stock_effect) are intentionally disabled while seeding:
-- items.stock_quantity above already reflects the CURRENT/resulting
-- state from src/lib/mock-data.ts, so replaying this history through the
-- triggers would double-count it. Live inserts made through the app after
-- this point go through the triggers normally.
-- ---------------------------------------------------------------------

alter table public.delivery_items disable trigger trg_delivery_items_stock_bump;
alter table public.releases disable trigger trg_releases_stock_effect;
alter table public.items disable trigger trg_audit_items;
alter table public.deliveries disable trigger trg_audit_deliveries;
alter table public.releases disable trigger trg_audit_releases;
alter table public.users disable trigger trg_audit_users;

insert into public.deliveries (ref_no, po_number, delivery_date, supplier, received_by, remarks) values
  ('DEL-2024-082', 'OR-00482', '2024-05-24', 'ABC Supplies Corp.',     '10000000-0000-0000-0000-000000000002', null),
  ('DEL-2024-081', null,       '2024-05-21', 'XYZ Trading',            '10000000-0000-0000-0000-000000000002', null),
  ('DEL-2024-080', null,       '2024-05-18', 'Metro Office Depot',     '10000000-0000-0000-0000-000000000002', null),
  ('DEL-2024-079', null,       '2024-05-15', 'ABC Supplies Corp.',     '10000000-0000-0000-0000-000000000002', null),
  ('DEL-2024-078', null,       '2024-05-10', 'Delta Hardware',         '10000000-0000-0000-0000-000000000002', null)
on conflict (ref_no) do nothing;

insert into public.delivery_items (delivery_id, item_id, quantity, unit_cost)
select d.delivery_id, i.item_id, v.quantity, v.unit_cost
from (values
  ('DEL-2024-082', 'ITM-0041', 50, 220),
  ('DEL-2024-082', 'ITM-0055', 30, 45)
) as v(ref_no, item_code, quantity, unit_cost)
join public.deliveries d on d.ref_no = v.ref_no
join public.items i on i.item_code = v.item_code;

insert into public.releases (ris_number, release_date, requested_by, approved_by, department, scio, purpose, status, remarks) values
  ('RIS-2024-0218', '2024-05-25', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Finance',     'Main Campus', 'Monthly office supply restock for the Finance Office.', 'approved', null),
  ('RIS-2024-0217', '2024-05-24', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'MIS',         'Main Campus', null, 'approved', null),
  ('RIS-2024-0216', '2024-05-23', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Engineering', 'Main Campus', null, 'approved', null),
  ('RIS-2024-0215', '2024-05-22', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'HR',          'Main Campus', null, 'approved', null),
  ('RIS-2024-0214', '2024-05-21', '10000000-0000-0000-0000-000000000002', null,                                    'Arts',        'Main Campus', null, 'pending',  null),
  ('REQ-0091', '2024-05-24', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Engineering', 'Main Campus', 'Classroom supplies for the semester.', 'approved', 'Ready for pickup'),
  ('REQ-0088', '2024-05-20', '10000000-0000-0000-0000-000000000003', null,                                    'Engineering', 'Main Campus', null, 'pending',  null),
  ('REQ-0084', '2024-05-14', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Engineering', 'Main Campus', null, 'approved', null),
  ('REQ-0079', '2024-05-08', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Engineering', 'Main Campus', null, 'approved', null)
on conflict (ris_number) do nothing;

insert into public.release_items (release_id, item_id, quantity, unit_cost)
select r.release_id, i.item_id, v.quantity, i.unit_cost
from (values
  ('RIS-2024-0218', 'ITM-0041', 10),
  ('RIS-2024-0218', 'ITM-0067', 2),
  ('REQ-0091',      'ITM-0041', 10),
  ('REQ-0091',      'ITM-0201', 24)
) as v(ris_number, item_code, quantity)
join public.releases r on r.ris_number = v.ris_number
join public.items i on i.item_code = v.item_code;

alter table public.delivery_items enable trigger trg_delivery_items_stock_bump;
alter table public.releases enable trigger trg_releases_stock_effect;
alter table public.items enable trigger trg_audit_items;
alter table public.deliveries enable trigger trg_audit_deliveries;
alter table public.releases enable trigger trg_audit_releases;
alter table public.users enable trigger trg_audit_users;

-- ---------------------------------------------------------------------
-- 6. System settings (singleton) — matches the defaults already shown on
-- src/app/admin/settings/page.tsx.
-- ---------------------------------------------------------------------

insert into public.system_settings (id, institution_name, system_title, fiscal_year_start, currency, low_stock_threshold_percent)
values (
  true,
  'University of Science and Technology of Southern Philippines',
  'Supply and Property Management System',
  'January',
  'Philippine Peso (₱)',
  20
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7. System logs — a handful of hand-authored rows matching
-- src/lib/mock-data.ts `systemLogs` for a populated first look at the
-- System Logs screen (in addition to whatever real usage adds later).
-- ---------------------------------------------------------------------

insert into public.system_logs (user_id, action, module, description, created_at) values
  ('10000000-0000-0000-0000-000000000002', 'create', 'Deliveries', 'Recorded delivery DEL-2024-082', '2024-05-26 09:14:00+08'),
  ('10000000-0000-0000-0000-000000000002', 'login',  'Auth',       'User logged in successfully',    '2024-05-26 08:02:00+08'),
  ('10000000-0000-0000-0000-000000000002', 'update', 'Releases / RIS', 'Approved RIS-2024-0218',     '2024-05-25 16:41:00+08'),
  ('10000000-0000-0000-0000-000000000003', 'create', 'Releases / RIS', 'Submitted supply request REQ-0091', '2024-05-25 11:20:00+08'),
  ('10000000-0000-0000-0000-000000000001', 'update', 'Users',      'Deactivated user Ramon Santos',  '2024-05-24 14:55:00+08'),
  ('10000000-0000-0000-0000-000000000002', 'update', 'Inventory',  'Updated stock level for ITM-0041', '2024-05-24 10:10:00+08');
