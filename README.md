# USTP Supply & Property Management System

Web-based supply and property management system with integrated inventory
and consumable release tracking, built for USTP Villanueva Campus. Capstone
project — Next.js (App Router) + Supabase, deployed on Vercel, all free tier.

## Status

All ten screens from the thesis mockups (Figures 3.1-3.10) are built in a
minimalist black-and-white theme — see `src/app/*/page.tsx`. Pages still read
from **static mock data** (`src/lib/mock-data.ts`); the Supabase schema, RLS,
and auth are written (see below) but not yet applied to any live database —
every fork starts from zero and applies its own copy, see
["Setting up your own Supabase backend"](#setting-up-your-own-supabase-backend-forks)
below.

- Dashboard — `/dashboard`
- Inventory Management — `/inventory`
- Record Deliveries — `/deliveries`
- Process Consumable Release (RIS) — `/releases`
- Reports — `/reports`
- Request Supplies (Faculty/Staff end-user view) — `/request-supplies`
- Manage Users — `/admin/users`
- Manage Roles — `/admin/roles`
- System Settings — `/admin/settings`
- System Logs — `/admin/logs`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Reference material

`reference/thesis.docx` is the capstone paper — Chapter 3 (Methodology,
Requirements Analysis, ERD, Use Case Diagram, System Flowchart, Mockup/UI
Design) is the source of truth for what this system should do.
`reference/thesis_text.txt` is a plain-text extraction of the same document
for quick searching.

## Supabase

Client helpers are in `src/lib/supabase/client.ts` (browser) and
`src/lib/supabase/server.ts` (server components) — these work against
**whatever** project you point them at via `.env.local`, there's nothing
hardcoded to the original capstone project. Route protection lives in
`src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts` — if you're
used to older Next.js docs, that's not a typo).

The full schema — tables, Row Level Security policies, triggers for
automatic stock updates, and seed data — is written as 9 numbered SQL files
under `supabase/migrations/`. It is **not applied to any database by
default**. If you forked this repo, follow the steps below to stand up your
own copy.

## Setting up your own Supabase backend (forks)

This is deliberately a manual, copy-and-paste process rather than a
one-command script — the point is to actually read each migration file as
you run it, so you understand what tables/policies/triggers your app is
built on, not just trust that "it works."

1. **Create your own free Supabase project** at [supabase.com](https://supabase.com)
   (New Project). This is completely separate from anyone else's project —
   forking the code does not fork the database.
2. **Get your project's API credentials**: in your Supabase dashboard, go to
   Project Settings → API. Copy the "Project URL" and the "anon public" key.
3. **Create your `.env.local`**: copy `.env.local.example` to `.env.local`
   and paste your own URL and anon key into
   `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`. This file is
   gitignored — never commit real keys.
4. **Run the migrations, in order, by hand**: open your Supabase dashboard →
   SQL Editor. For each file below, in this exact order — open it in your
   code editor, copy the whole file, paste it into a new SQL Editor query,
   and click Run. Confirm you see a success message before moving to the
   next one:
   1. `20260821000100_extensions_and_enums.sql`
   2. `20260821000200_roles_and_permissions.sql`
   3. `20260821000300_users_and_auth.sql`
   4. `20260821000400_categories_and_items.sql`
   5. `20260821000500_deliveries.sql`
   6. `20260821000600_releases.sql`
   7. `20260821000700_reports_settings_units.sql`
   8. `20260821000800_system_logs_and_audit.sql`
   9. `20260821000900_seed_data.sql`

   **Order matters** — later files reference tables, enums, and functions
   that earlier files create (foreign keys, triggers, RLS helper functions).
   Running them out of order, or skipping one, will fail with a clear
   Postgres error (e.g. "relation does not exist") telling you what's
   missing — that's expected, just go back and run whatever you skipped.
5. **Check it worked**: open Table Editor in the Supabase dashboard — you
   should see `roles`, `role_permissions`, `users`, `categories`, `items`,
   `deliveries`, `delivery_items`, `releases`, `release_items`, `reports`,
   `system_settings`, `units_of_measure`, and `system_logs`.
6. **Seed login accounts**: migration 9 seeds a few sample accounts, but it
   does so by inserting directly into Supabase's internal `auth.users` table,
   which isn't the officially supported way to create auth users and may not
   actually let you log in. If login fails, create your own accounts instead
   via dashboard → Authentication → Add User — use the same email addresses
   the seed data references (e.g. `admin@school.edu.ph`) if you want them to
   pick up the already-seeded profile row and role, or your own emails if you
   update `supabase/migrations/20260821000900_seed_data.sql` to match first.
7. **Run it**: `npm install && npm run dev`, then log in at
   `http://localhost:3000/login`.

## Next steps (still open, not yet done on any fork)

1. Replace `src/lib/mock-data.ts` reads with real Supabase queries — helpers
   already shaped to match in `src/lib/supabase/queries.ts`, not yet wired
   into any page.
2. Reconcile `src/lib/mock-data.ts`'s `roleDefinitions` (currently gives
   Admin full permissions) with the real seeded `role_permissions` (Admin is
   correctly excluded from inventory/delivery/RIS/report access, per the
   thesis's Use Case Diagram) — the mock UI and the real backend currently
   disagree.
3. Cross-page stock sync: Deliveries/Releases saves don't yet bump
   Inventory's on-hand counts on the mock-data pages (the real DB triggers
   already do this correctly once queries are wired in).
4. QA pass once real data is wired: test RLS as each of the four roles (see
   `docs/test-plan.md`), not just the UI's own permission toggles.
