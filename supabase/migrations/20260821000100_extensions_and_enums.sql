-- USTP Supply & Property Management System
-- Migration 01: extensions + enum types
--
-- Design notes (see final report for full rationale):
--  - Enums map to the ERD's bare "status" fields on Users/Items/Categories,
--    plus a unified release_status for the merged Requests/RIS lifecycle
--    (pending -> approved|rejected -> released) and a log_action enum for
--    the System Logs audit trail (gap-fill #2 in the task brief).
--  - `role` is intentionally NOT an enum here (see migration 02) — the
--    Manage Roles screen needs real, admin-editable roles + a permission
--    matrix, so we use roles/role_permissions tables with a role_id FK on
--    users instead of a fixed enum (gap-fill #1).

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_status as enum ('active', 'inactive', 'discontinued');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.category_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Unified lifecycle for the merged Requests/RIS entity (gap-fill #4):
  -- one row's status carries it from Faculty/Staff submission through
  -- Officer approval and final release.
  create type public.release_status as enum ('pending', 'approved', 'rejected', 'released');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.log_action as enum ('login', 'create', 'update', 'delete');
exception when duplicate_object then null; end $$;
