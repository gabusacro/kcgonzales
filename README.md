# USTP Supply & Property Management System

Web-based supply and property management system with integrated inventory
and consumable release tracking, built for USTP Villanueva Campus. Capstone
project — Next.js (App Router) + Supabase, deployed on Vercel, all free tier.

## Status

All ten screens from the thesis mockups (Figures 3.1-3.10) are built and
running on **static mock data** (`src/lib/mock-data.ts`) in a minimalist
black-and-white theme — see `src/app/*/page.tsx`. Supabase auth, schema, and
RLS are not wired up yet; that's the next phase.

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

Project ref: `tygvafyeqtjlpzaqtivy`. `.env.local` has
`NEXT_PUBLIC_SUPABASE_URL` set; `NEXT_PUBLIC_SUPABASE_ANON_KEY` still needs
to be filled in before any page can talk to the database. Client helpers are
in `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts`
(server components).

## Next steps

1. Design the Postgres schema from the ERD (Users, Roles, Categories, Items,
   Deliveries, RIS/Releases, Requests, System Logs) and apply it via the
   Supabase MCP connection or the SQL editor.
2. Add Row Level Security matching the four roles (Admin, Supply Officer,
   Faculty, Staff) and the Manage Roles permissions matrix.
3. Replace `src/lib/mock-data.ts` reads with real Supabase queries.
4. Wire up Supabase Auth (login/logout) and route protection.
5. QA pass: verify each screen against its mockup, test RLS as each role,
   check report output against the Stock Card/RIS previews.
