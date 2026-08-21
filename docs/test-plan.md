# USTP Supply & Property Management System — QA Test Plan & Screen Audit

**Prepared by:** QA (this worktree)
**Date:** 2026-08-21
**Reviewed against commit:** `f579c4c` — "Initial scaffold: Next.js + Supabase, all 10 thesis screens on mock data" (master, at time of writing)
**Source of truth used:** `reference/thesis_text.txt` (Chapter 3 — Methodology, Requirements Analysis, Mockup/UI Design), plus the actual Figure 3.4 (ERD) and Figure 3.5 (Use Case Diagram) images, source-verified separately.

## How to read this document

This is a living QA document, not a one-time report. It has six parts:

1. **Functional requirement test cases** — one test (or small group) per item in the thesis's Functional Requirements list. Written so a non-coder can run them once auth and real data exist.
2. **Non-functional requirement test cases** — Security, Reliability, Usability, Performance, Maintainability, Availability.
3. **Screen-by-screen audit** — every built screen compared line-by-line against its thesis Figure description. This is the part that found actual bugs, not just gaps.
4. **RLS-per-role test checklist** — what each of the 3 real permission tracks should and shouldn't be able to do, per table. Not executable yet (no schema/auth landed this round) but ready to run the moment it does.
5. **Report output shape check** — Stock Card verified in detail; the other four report types are documented as stubs.
6. **Documentation issues** — problems in the thesis text itself, for Gab to fix in the written thesis. Not code bugs.

Where a test can't be run yet because the feature isn't wired up (no login, no backend), I've marked it **NOT YET TESTABLE** and written the test steps for later anyway, per the assignment.

---

## Part 1 — Functional Requirement Test Cases

| # | Requirement (thesis wording) | Test case | Status today |
|---|---|---|---|
| FR-01 | Log in and log out securely | 1. Go to the site with no session. Confirm you land on a **login screen**, not the dashboard. 2. Enter wrong credentials — confirm a clear error, no access granted. 3. Enter correct credentials — confirm you land on the dashboard appropriate to your role. 4. Refresh the page — confirm you stay logged in. 5. Click Logout — confirm you're returned to the login screen and that pressing "back" does not restore access. 6. While logged out, manually type the URL of any inner page (e.g. `/inventory`) — confirm you're redirected to login, not shown the page. | **NOT YET TESTABLE.** There is no login screen at all right now — see Finding S-1 below. |
| FR-02 | Manage user accounts and user roles | 1. As Admin, add a new user with a role — confirm they appear in Manage Users and can log in. 2. Edit a user's role — confirm their access changes accordingly on next login. 3. Deactivate a user — confirm they can no longer log in and their badge shows "Inactive". 4. As a non-Admin, confirm Manage Users/Manage Roles pages are unreachable. | Screens exist and filter/search work on mock data; Add/Edit buttons are not wired to anything yet. |
| FR-03 | Record and manage inventory items and supply information | 1. Add a new item with a unique item code — confirm it appears in the inventory table and the "Total items" count increases by 1. 2. Try adding a duplicate item code — confirm it's rejected. 3. Edit an item's on-hand qty/reorder level — confirm the Status badge (OK/Low/Critical) recalculates automatically. | Table, search, and category filter work on mock data. Add/Edit buttons are decorative — no form is wired yet. |
| FR-04 | Categorize inventory and consumable items | 1. As Admin, add a new category in System Settings — confirm it appears as a filter option on the Inventory page. 2. Mark a category Inactive — confirm items already in it are unaffected but it's no longer offered when adding a *new* item. | Category/UoM list UI exists in System Settings; not wired to Inventory's filter dropdown yet (they're two separate mock arrays today — see Finding I-2). |
| FR-05 | Record incoming deliveries and supply transactions, with automatic stock update | 1. Record a delivery of 50 units of Item X. 2. Confirm Item X's on-hand quantity in Inventory increases by exactly 50 immediately after saving. 3. Confirm the delivery appears in "Recent deliveries" with the correct ref no., supplier, date, and item count. 4. Confirm a new "Receipt" row appears on that item's Stock Card with the correct running balance. | Form UI complete and matches the mockup. "Save delivery" does not yet touch inventory numbers — no backend wired. |
| FR-06 | Process consumable supply releases through RIS generation, with stock validation | 1. Attempt to release more units than are currently on hand — confirm the system blocks or clearly warns before submission. 2. Release a valid quantity — confirm on-hand decreases by that amount, the RIS appears in RIS history with status "Pending" or "Approved" per your workflow, and a new "Issue" row appears on the item's Stock Card. 3. Confirm an item already below reorder level is visibly flagged in the release form before you submit. | Form UI complete. Stock-validation and the low-stock flag exist visually but use a placeholder rule, not the item's real Critical/Low status — see Finding R-1. No backend to actually decrement stock. |
| FR-07 | Monitor stock quantities and inventory balances in real time | 1. Perform a delivery or release as above. 2. Without a full page reload cycle beyond normal navigation, confirm the Dashboard's "Total items"/"Low stock" counts and the Inventory table's on-hand numbers reflect the change. Define "real-time" here as: reflected on next visit to the page, not requiring a manual data refresh action or a support ticket. | Dashboard and Inventory both read from the same mock arrays today, so they're consistent with each other, but neither updates from a live transaction because there's no backend yet. |
| FR-08 | Allow faculty and staff to request supplies | 1. Log in as a Faculty/Staff user. 2. Submit a request for 2+ items. 3. Confirm it appears at the top of "My request status" as Pending. 4. Confirm you cannot see other users' requests. | Form + own-request list UI complete and matches the mockup closely (see Screen Audit — Request Supplies: no findings). Submission isn't persisted anywhere yet. |
| FR-09 | Track request status and release transactions | 1. As Supply Officer, approve a pending request/RIS. 2. As the requesting Faculty/Staff user, confirm the status badge, approver name, approval date, and remarks update on their Request Supplies page without any action needed on their end besides navigating there. | Both sides of this exist as separate mock arrays (`myRequests` vs `risRecords`) with no linkage between them yet — can't test the sync until they're one system. |
| FR-10 | Generate reports (stock cards, RIS forms, monthly/quarterly/yearly, transaction history) | See Part 5 below — Stock Card is fully specified and testable now; the other four are stubs. | Partially testable (Stock Card only). |
| FR-11 | Search and filtering for inventory records and transactions | For each of: Inventory search+category filter, Manage Users search+role filter, System Logs search+action+user filters, Releases status filter — 1. Search a term that matches — confirm only matching rows show. 2. Search a term that matches nothing — confirm a clear "no results" state, not a blank table. 3. Clear the search — confirm the full list returns. | All four search/filter sets work client-side against mock data today, including the "no items match your search" empty state on Inventory. Releases' status filter is missing two of the four possible statuses — see Finding RL-2. |
| FR-12 | Store and retrieve inventory records through a centralized database | 1. Have two different logged-in users (e.g. two Supply Officers, or one on desktop + one on mobile) view Inventory at the same time. 2. One records a delivery. 3. Confirm the other sees the updated on-hand number without needing special steps. | Not yet testable — today "centralized" just means one shared TypeScript file (`src/lib/mock-data.ts`), not a real database. Becomes testable once Supabase schema lands. |

---

## Part 2 — Non-Functional Requirement Test Cases

| # | Quality attribute (thesis wording) | Test case | Status today |
|---|---|---|---|
| NFR-01 | **Security** — only authorized users access features/records, via secure login + role-based access | 1. While logged out, type the URL of every admin page directly (`/admin/users`, `/admin/roles`, `/admin/settings`, `/admin/logs`) and every officer page (`/inventory`, `/deliveries`, `/releases`, `/reports`) — confirm every one of them redirects to login. 2. Log in as Faculty/Staff, then type an admin/officer URL directly — confirm access is denied (not just hidden from the nav). 3. Confirm passwords are never visible in plain text anywhere in the UI or in the browser's network tab. | **NOT YET TESTABLE, and currently fails outright if run today**: there is no login, no session, and no `middleware.ts` — every page including all four Admin-only pages is reachable by anyone with the URL, with nothing hidden. This is expected at this stage (auth isn't wired yet per the README's own "Next steps"), but it's the single highest-priority item once Backend Dev's auth lands. |
| NFR-02 | **Reliability** — accurate, consistent data; minimal data loss | 1. Perform a delivery followed immediately by a release of the same item — confirm the running total is exactly what arithmetic predicts, with no dropped or duplicated transaction. 2. Force-close the browser mid-form-submission — confirm no partial/corrupt record is saved. | Not yet testable (no persistence layer). Note: the *mock* Stock Card ledger itself currently contains a running-balance error — see Finding RP-1 — worth re-checking that the real implementation doesn't repeat that mistake. |
| NFR-03 | **Usability** — user-friendly, easy to navigate, for Admin/Supply Officer/Faculty/Staff alike | 1. Give a non-technical staff member (ideally an actual intended end user) the Request Supplies flow with no instructions — can they submit a request unassisted? 2. Confirm every icon-only button (edit pencil, trash, chevrons) has a hover state or tooltip so its purpose isn't a guess. 3. Confirm color is never the *only* signal for status (i.e., badges also carry text, not just color) — checked and true today (Badge component always renders the status word, e.g. "Critical", alongside the color). | Partially testable now via a usability walkthrough of the Request Supplies and Inventory screens on mock data. One concrete gap: the End User (Faculty/Staff) sidebar nav items and Logout are inert — see Finding EU-1 — which would fail a usability walkthrough today. |
| NFR-04 | **Performance** — efficient transaction/report/data-retrieval processing, minimal delay | 1. With a realistic-sized inventory (a few hundred to low thousands of items — the thesis's own hardware spec targets a 4GB-RAM/i3-class machine), confirm the Inventory table's search stays responsive (no noticeable typing lag). 2. Confirm report generation returns in a few seconds, not tens of seconds. | Not meaningfully testable yet — mock data is only 8 inventory items and 6 log entries, far below a realistic load. Flag as a test to re-run once real data volume exists; current client-side filtering approach (filtering the *entire* array in the browser on every keystroke) should be watched as item counts grow into the hundreds+, since nothing paginates server-side yet. |
| NFR-05 | **Maintainability** — easy to update/maintain/enhance | 1. Confirm shared UI (Badge, Card, Button, StatCard) is reused consistently rather than each screen reinventing its own table/badge styling — checked and largely true today (all 10 screens import from `src/components/ui/*`). 2. Confirm mock-data shapes in `src/lib/types.ts` match what the real schema will need, to minimize rework — flagged gaps noted throughout this document (e.g. Finding U-1/U-2 on the Faculty/Staff role split). | Passes the structural check today; the type-model gaps noted below are exactly the kind of thing that becomes expensive to fix *after* the real schema is built, so raising them now is the point of this audit. |
| NFR-06 | **Availability** — accessible on the university's local network whenever authorized personnel need it | 1. Once deployed, confirm the app is reachable during normal working hours without manual intervention. 2. Confirm a Vercel free-tier cold start or a Supabase free-tier pause (both plans can idle/pause on inactivity) doesn't produce a confusing blank page — there should be a loading state, not a silent failure. | Not yet testable (not deployed this round). **Judgment call flagged**: the thesis's Scope and Limitations section describes a LAN-only, offline-capable PWA — the actual system being built is a public-internet, Vercel+Supabase cloud app with no PWA manifest/service worker at all. This is a real mismatch between the written thesis and the built system — see Documentation Issue D-2 below, since it changes what "availability" even means for this NFR (internet uptime vs. campus LAN uptime). |

---

## Part 3 — Screen-by-Screen Audit

Reviewed: every `src/app/**/page.tsx`, the shared shells (`AppShell.tsx`, `EndUserShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`), and `src/lib/mock-data.ts` / `types.ts`, against their corresponding thesis Figure description. I did **not** assume anything is fine by default — findings below are things I actually traced in the code, not guesses.

### Cross-cutting findings (apply to more than one screen)

**Finding S-1 — No login screen exists at all.** `src/app/page.tsx` is a single unconditional `redirect("/dashboard")`. There is no `middleware.ts` anywhere in the project. Every one of the ten built screens — including all four Admin-only ones — is reachable by anyone who has the URL, right now, with zero gating. This is expected for this stage (Backend Dev's auth isn't wired up yet, per the README), but it means FR-01 and NFR-01 currently have literally 0% coverage, and it should be the very first thing re-tested the moment auth lands.

**Finding S-2 — Sidebar shows every nav item to everyone; "Logout" doesn't log out.** `Sidebar.tsx` renders the MAIN section (Dashboard/Inventory/Deliveries/Releases/Reports) and the ADMIN section (Manage Users/Roles/Settings/Logs) unconditionally — there's no `if (role === ...)` anywhere in that file. Today's mock `currentUser` is a "Supply Officer" (`src/lib/mock-data.ts`), yet that Supply Officer's sidebar still shows Manage Users/Roles/Settings/Logs, which the confirmed Use Case Diagram says Supply Officers should never see. Separately, the sidebar's "Logout" is a `<Link href="/">`, and since `/` just redirects back to `/dashboard`, clicking Logout currently bounces you right back into the app instead of ending the session. Both are expected placeholder behavior pre-auth, but worth a test case once real sessions exist: **confirm the nav itself changes shape per role, not just that the underlying pages are protected.**

**Finding EU-1 — The Faculty/Staff (End User) sidebar is not functional, and is missing screens the Use Case Diagram promises them.** In `EndUserShell.tsx`, the two "END USER" nav items ("Search items", "Request supplies") are rendered as plain `<div>` elements, not `<Link>`s — they are not clickable at all, unlike the Admin/Officer `Sidebar.tsx` which correctly uses `<Link>`. The "Logout" at the bottom is likewise a plain `<div>`. More importantly: the source-verified Use Case Diagram grants the merged Faculty/Staff actor five things — request supplies, view own request status, view own released history, **dashboard**, and **profile**. The current build gives them exactly one page (Request Supplies) and no Dashboard, no Profile, and no way to see "released history" as distinct from "request status." This isn't just a polish gap — it's a scope gap against the confirmed ground truth, worth flagging to Frontend Dev directly rather than only noting here.

**Finding U-1 — Manage Users and Manage Roles disagree on how many roles exist.** Manage Roles (`src/app/admin/roles/page.tsx`, backed by `roleDefinitions` in mock-data.ts) correctly shows **three** permission tracks: Admin, Supply Officer, and "Faculty / Staff" merged — matching the source-verified Use Case Diagram exactly, and confirmed unchanged as of this commit. But Manage Users (`src/app/admin/users/page.tsx`) filters and displays **four** separate role labels — Admin, Supply Officer, Faculty, Staff — and `src/lib/types.ts` bakes this in at the type level: `UserRole = "Admin" | "Supply Officer" | "Faculty" | "Staff"`. Nothing in the code maps a user's individual "Faculty" or "Staff" label to the single "Faculty / Staff" permission card, because no permission-checking logic exists yet. This is a genuine ambiguity, not a clear-cut bug: it's reasonable to want to keep "Faculty" vs "Staff" as a *display* label (useful for the Manage Users table) while giving both the same *permissions* — but that mapping needs to be an explicit, deliberate decision when Backend Dev designs the real roles table, not an accident of two screens built at different times. **Flag for Backend Dev:** decide and document whether the roles enum has 3 values or 4-labels-mapping-to-3-permission-sets before writing RLS policies, since the policies themselves will need to treat Faculty and Staff identically either way.

**Finding U-2 — Manage Users' role badges don't actually distinguish three of the four roles.** The thesis (Figure 3.7) explicitly calls for "a color-coded badge to visually distinguish between Admins, Supply Officers, Faculty, and Staff." The code's `roleTone()` in `src/components/ui/Badge.tsx` is:
```
if (role === "Admin") return "neutral-dark";
return "neutral";
```
Supply Officer, Faculty, and Staff all render as the exact same plain gray "neutral" badge — only Admin looks different. A user scanning the Manage Users table today cannot tell a Supply Officer from a Staff member from a Faculty member by badge color, contradicting the mockup's stated purpose for that column.

### Dashboard (`src/app/dashboard/page.tsx`) — Figure 3.1

- 4 metric cards (total items, low stock, deliveries, RIS processed): **matches.**
- Stock-by-category horizontal bars, using the same 5 categories named in the thesis (Office Supplies, Janitorial, IT Supplies, Medical, Electrical): **matches.**
- Pending requests panel (item, department, qty, status): **matches.**
- **Finding D-1 — Low-stock table is missing its Status column.** The thesis is explicit: the bottom table should include "the item code, item name, category, unit, quantity on hand, reorder level, **and status indicator**." The built table's header row is `["Item code", "Item name", "Category", "Unit", "On hand", "Reorder lvl"]` — no Status column, no badge, even though every row in that table is by definition a Low or Critical item and the Inventory page two clicks away renders that exact same badge just fine. This is a straightforward, fixable omission, not a design ambiguity.

### Inventory Management (`src/app/inventory/page.tsx`) — Figure 3.2

- 3 metric cards (total items, below reorder, active categories): **matches.**
- Search bar + category dropdown, both functionally wired client-side: **matches and works.**
- Table columns (Item Code, Item Name, Category, Unit, On Hand, Reorder Level, Status badge, Action/edit): **matches exactly**, including the three-tone badge logic (Critical=red/Low=amber/OK=green).
- Add Item button, pagination control: present, but **decorative only** — pagination buttons have no `onClick`/page state (harmless at 8 mock rows, but note for later).
- **Minor data nit (not a UI bug):** `stockByCategory` on the Dashboard shows "IT Supplies: 47" but zero items in `inventoryItems` actually belong to the "IT Supplies" category — the category filter dropdown on this page won't even offer it as an option, since it's derived from `inventoryItems` directly (`Array.from(new Set(inventoryItems.map(i => i.category)))`). Purely a mock-data completeness gap, low priority.

### Record Deliveries (`src/app/deliveries/page.tsx`) — Figure 3.3

- Two-panel layout; left form (ref no., date, supplier, OR/PO no., received-by dropdown, dynamic item+qty+unit-cost entry, computed line totals, running grand total, Save Delivery); right panel (recent deliveries list — ref no., supplier, date, item count): **matches on every field named in the thesis.** No findings — this is one of the most faithful screens to its mockup description.
- Note: "Received by" dropdown has only one hardcoded name and the delivery ref number is a hardcoded string rather than generated — expected at mock stage, not a design deviation.

### Process Consumable Release / RIS (`src/app/releases/page.tsx`) — Figure 3.4

- Two-panel layout; left form (RIS no., release date, requesting dept., SCIO, purpose textarea, item+qty entry, save-draft/submit-for-approval buttons): **matches.**
- Right panel (RIS history, status filter, export button): **matches**, rendered as a list rather than a literal `<table>` — consistent with how the rest of the app renders similar "recent records" lists (e.g. Deliveries), so not treated as a mismatch.
- **Finding R-1 — The "critically low stock" flag uses an arbitrary rule, not the item's real status.** The thesis says items with critically low stock should be flagged in the release-item table. The code does: `const low = line.stock < line.qty * 2;` — i.e., it flags an item if the stock on hand is less than *twice the quantity being requested right now*, regardless of that item's actual Critical/Low/OK status used everywhere else in the app. Two consequences: (1) requesting a small quantity of a genuinely Critical item can fail to trigger the warning, and (2) the warning icon is always the same amber `AlertTriangle` — it never turns red for a truly Critical item the way the Inventory badge does. Recommend reusing the item's real `status` field (or reorder-level comparison) instead of a made-up multiplier.
- **Finding R-2 — Status filter is missing two of the four possible statuses.** The dropdown only offers `All status / Pending / Approved`, but `RequestStatus` (in `types.ts`) also includes `Rejected` and `Released` — both real states a RIS can be in. An officer can't filter for either today.

### Reports (`src/app/reports/page.tsx`) — Figure 3.5

- 5 report-type cards (Stock Card, RIS/Release Form, Monthly/Quarterly/Yearly, Per SCIO, Transaction History), selected-state border, print/export buttons: **matches.**
- Stock Card preview header (item code, unit, reorder level) and ledger columns (Date, Reference, Receipt Qty, Issue Qty, Balance): **matches the thesis's named columns exactly** — see Part 5 for the detailed math check, which found a real bug.
- The other 4 report types are fully stubbed (icon + "Select criteria to generate…" placeholder) with no fields defined yet — **expected at this stage**, documented, not a defect.

### Request Supplies — Faculty/Staff end-user view (`src/app/request-supplies/page.tsx`) — Figure 3.6

- Left form (department, date needed, purpose, item+qty entry, submit button): **matches.**
- Right panel, upper (previous requests: ref no., date, item count, status) and lower (selected request detail: status, approved by, approved on, remarks): **matches exactly**, including the click-to-select interaction between the two panels. This is the most faithful screen to its mockup in the whole build — no findings against the Figure itself. (Its containing shell has the EU-1 nav issue noted above, but the page content itself is solid.)

### Manage Users (`src/app/admin/users/page.tsx`) — Figure 3.7

- Search + role filter, Add User button, table columns (avatar/initials, full name, email, role badge, SCIO/dept., status badge, edit action): **all present, matching the thesis's named columns.**
- See Findings U-1 and U-2 above — both live on this screen (or its shared Badge component).

### Manage Roles (`src/app/admin/roles/page.tsx`) — Figure 3.8

- Structure — 3 role cards with name/description/user-count, selected-card border, right-panel permissions-toggle matrix, Save Permissions button: **matches the thesis exactly**, and correctly reflects the 3-way Admin/Supply-Officer/Faculty-Staff split confirmed from the actual Use Case Diagram. **This part was already correct as of the last commit and remains so.**
- **Finding U-3 (headline finding — the permission *values* invert the ground truth).** The 8 permission toggles for **Admin** in `roleDefinitions` are: Manage inventory ✅, Record deliveries ✅, Process RIS ✅, Generate reports ✅, Manage users ✅, System settings ✅, View system logs ✅, Approve requests ✅ — literally everything is `true`. But the source-verified Use Case Diagram says System Administrator gets **only** user/role/settings/logs/backup management — explicitly **not** inventory, deliveries, RIS, or reports, and "approve requests" belongs to the Supply and Property Officer, not the Admin. So today's mock data gives Admin *strictly more* access than the diagram allows, in exactly the 5 categories the diagram says to withhold. By contrast, the Supply Officer row is actually correct (inventory/deliveries/RIS/reports/approve = true; users/settings/logs = false) — it's specifically the Admin row that's wrong. This matters because if Backend Dev seeds initial RLS/permission data from this mock file, they'll be seeding the exact inverse of the intended Admin restriction. Recommend flipping Admin's Manage inventory / Record deliveries / Process RIS / Generate reports / Approve requests to `false` before this becomes real seed data.
- **Minor nit:** none of the 8 permission toggles correspond to "backup management," which the Use Case Diagram lists as part of Admin's scope. There's no toggle for it at all yet — worth adding when the real permissions list is finalized.
- **Minor data nit:** `userCount` values (Admin: 1, Supply Officer: 3, Faculty/Staff: 48) don't reconcile with the actual `systemUsers` mock array (which only has 4 users total, 1 of each of the 4 labels). Cosmetic only, since these are two independently-authored mock arrays.

### System Settings (`src/app/admin/settings/page.tsx`) — Figure 3.9

- General Settings form (Institution Name, System Title, Fiscal Year Start, Currency, Low-Stock Notification Threshold %, Save Changes): **matches exactly, same field order as the thesis prose.**
- Categories sub-panel (name, active/inactive badge, edit, add) and Units of Measure sub-panel (name, abbreviation, edit, add): **matches.**
- No findings against the Figure itself. Inputs are `defaultValue`-only placeholders with no live save, which is expected pre-backend.

### System Logs (`src/app/admin/logs/page.tsx`) — Figure 3.10

- Search bar, Action Type filter (Login/Create/Update/Delete — matches the thesis's named types exactly), User filter, Export button: **matches.**
- Table columns (Timestamp, User, Action badge, Module, Description), pagination: **matches.**
- No findings against the Figure itself. Note: the footer text "Showing X of **1,842** log entries" is a hardcoded fake total unrelated to the actual mock array length (6 entries) — harmless placeholder, but don't let it survive into a build with real data without wiring it to the real count.

---

## Part 4 — RLS-per-Role Test Checklist

Backend Dev's schema/RLS did not land in master this round, so none of this is executable yet. This is written now so it becomes the literal checklist the moment auth + schema exist. Table names below are the ones implied by the ERD plus the gap-fills Backend Dev was briefed to add (a real Roles/permissions table, a System_Logs table, a Deliveries↔Items junction table); expect to rename rows once the real migration exists, but the *rules* themselves come straight from the source-verified Use Case Diagram and should not change.

Three real permission tracks (per confirmed Use Case Diagram): **Admin**, **Supply Officer**, **Faculty/Staff** (merged — see Finding U-1 on whether "Faculty" and "Staff" stay as two display labels sharing one permission set).

| Table | Admin | Supply Officer | Faculty/Staff |
|---|---|---|---|
| Users | Read all, write all (create/edit/deactivate/reset password/assign role) | Read: own profile only (plus whatever minimal name list is needed to populate "received by" dropdowns — confirm exact scope when built). Write: own profile only | Read: own profile only. Write: own profile only |
| Roles / permissions matrix | Read all, write all | Read own role's permissions (read-only) | Read own role's permissions (read-only) |
| Categories / Units of Measure | Read all, write all (per Figure 3.9 — this is System Settings, not Inventory) | Read all (needed to categorize/file items). No write | Read all (needed to browse/filter when requesting). No write |
| Items / Inventory | **No access**, per Use Case Diagram (flag to Gab if Admin oversight visibility is actually wanted — see note below) | Read all, write all (add/edit items, adjust stock) | Read all (to browse when building a request). No write |
| Deliveries + delivery line-items | No access | Read all, write all (record new deliveries) | No access — not part of their use cases |
| Requests (Faculty/Staff-submitted, pre-RIS) | No access | Read all (to review/approve), write (update status/approver/remarks). Whether a Supply Officer can also *file* a request as an end user is an open question — flag if relevant | Read: **own rows only**. Write: create (insert) own requests only; whether they can edit/cancel a still-Pending request is an open question — flag if relevant |
| Releases / RIS + release line-items | No access | Read all, write all (create/approve/release) | Read: only RIS/releases tied to their own request or department ("view own released history"). No write |
| System Logs (audit trail) | Read all. Write: none manually — entries should only ever be inserted automatically by the system itself when an action occurs, never hand-edited, including by Admin, to preserve audit integrity | No access | No access |
| Reports (if a literal generated-report/metadata table exists, vs. purely derived from other tables) | Open question — not part of Admin's listed use cases, but flag if Gab wants Admin oversight here | Read/write (generate, export) | No access — not part of their use cases |

**Note to flag to Gab:** the Use Case Diagram, as source-verified, gives System Administrators *zero* visibility into inventory/deliveries/RIS/reports — not even read-only oversight. That's a deliberate, confirmed finding from the diagram, not a guess, but it's worth double-checking with Gab that this is really the intended real-world policy (an Admin locked out of ever *seeing* stock levels is unusual for a role called "Administrator," even if it's exactly what the diagram draws). If that's not actually the intent, the fix is to correct the diagram/thesis text, not to silently grant Admin extra access in code.

---

## Part 5 — Report Output Shape Check

**Stock Card** (`src/app/reports/page.tsx` + `stockCardLedger` in `mock-data.ts`) — thesis spec: "a tabular ledger containing columns for Date, Reference Number, Receipt Quantity, Issue Quantity, and Running Balance."

- Column names: built as `Date / Reference / Receipt qty / Issue qty / Balance` — **matches exactly.**
- Running-balance math, row by row:

| Date | Reference | Receipt | Issue | Balance shown | Balance expected | OK? |
|---|---|---|---|---|---|---|
| May 01 | Opening balance | — | — | 20 | 20 (starting point) | ✅ |
| May 05 | DEL-2024-082 | 50 | — | 70 | 20 + 50 = 70 | ✅ |
| May 08 | RIS-2024-0218 | — | 20 | 50 | 70 − 20 = 50 | ✅ |
| May 15 | **RIS-2024-0224** | **30** | — | **20** | 50 + 30 = 80 (if Receipt is really 30) | ❌ |
| May 20 | RIS-2024-0229 | — | 17 | 3 | 20 − 17 = 3 (only works if the row above ends at 20) | ✅ *only if the row above is fixed* |

**Finding RP-1 — Stock Card ledger has a real running-balance bug.** The May 15 row is filed under a "RIS-…" reference number — which, everywhere else in this system, means an *issuance* document — yet it's recorded as a **Receipt** of 30, and the balance shown (20) is only mathematically consistent if that 30 were actually an **Issue**, not a Receipt (50 − 30 = 20 ✅, vs. the shown 50 + 30 = 80 ✅ used nowhere). Either the reference number is wrong (a delivery masquerading under a RIS number), or the quantity belongs in the Issue column, not Receipt. As it stands, the sample ledger's own numbers don't add up, and since this is the one report type the thesis fully specifies, it's worth fixing before this shape gets treated as "done" reference data. Recommend either swapping `receiptQty`/`issueQty` for that row, or replacing the reference number with a delivery-style ref (e.g. `DEL-2024-xxx`) if a receipt was genuinely intended.

**Other four report types** (RIS/Release Form, Monthly/Quarterly/Yearly, Per SCIO, Transaction History Per Item) — confirmed stubs only: a card exists in the selector, and selecting it shows a generic "Select criteria to generate…" placeholder with no columns, fields, or sample data defined yet. This matches the expected state at this stage of the build — documenting the gap, not treating it as a defect.

---

## Part 6 — Documentation Issues (thesis text — not code bugs)

These are things to fix in the written thesis document itself, not in the app. Listed separately per the assignment so they don't get mixed up with actual QA findings above.

1. **"GSO of the Municipality of Villanueva LGU" (Figures 3.1 and 3.2 mockup prose).** Both the Dashboard and Inventory Management mockup descriptions refer to "the General Services Office (GSO) of the Municipality of Villanueva LGU." This is almost certainly leftover template text from a different capstone — the system throughout the rest of the document, and as actually built, is for **USTP Villanueva Campus**, a university, not a municipal LGU. Recommend a find-and-replace pass across Chapter 3's mockup section.

2. **Scope and Limitations describes a different system than the one being built.** The thesis states: "The system will be deployed locally within the USTP campus network as a Progressive Web Application (PWA)... Integration with external suppliers, online procurement systems, barcode or RFID technologies, other university information systems... are beyond the scope." The actual system being built is a **cloud-hosted** Next.js app on Vercel with a Supabase (hosted Postgres) backend — reachable over the public internet, not restricted to a campus LAN — and there is no PWA manifest or service worker anywhere in the codebase (`public/` has no `manifest.json`, no offline support). This is a substantive mismatch a thesis panel could reasonably question, not just wording. Recommend either updating the Scope section to describe the real (cloud) deployment model, or clarifying that "locally" refers to institutional data ownership rather than network topology — but as written, it describes an offline-capable LAN PWA that doesn't match what exists.

3. **Software Requirements section names a different tech stack than what's implemented.** The thesis's Software Requirements list specifies: Frontend — ReactJS/HTML/CSS/JavaScript; Backend — **Node.js and Express.js**; Database — **MySQL**; Local server — XAMPP or Node.js Server. The actual implementation is **Next.js (App Router)** for both frontend and backend (API routes/server actions, no separate Express server), with **Supabase/Postgres** as the database, deployed to Vercel (no XAMPP/local server at all). React itself is technically present (Next.js is built on React), but Express and MySQL are not used anywhere in this repo. Recommend updating the Software Requirements section to name the actual stack, since a panel member familiar with either list would immediately notice the discrepancy.

4. **Figure numbering is reused across sections, which will confuse readers.** "Figure 3.1" is used once for the Agile Method diagram (Software Development Methodology section) and again for the Dashboard mockup (Mockup/UI Design section). "Figure 3.2" is used three times — Planning, the Timeline Gantt Chart, and Inventory Management. Recommend a single continuous figure numbering scheme across the whole chapter (e.g. Figures 3.1–3.20) rather than restarting the count at each subsection.

---

## Summary for Gab (plain-language)

- The 10 screens are visually complete and, on the whole, closely follow the thesis mockups — most screens (Deliveries, Request Supplies, System Settings, System Logs) have **no findings** against their Figure description at all.
- The two most important things this audit found are **not** cosmetic: (a) the Manage Roles screen's mock permission data currently gives the Admin role full access to inventory/deliveries/RIS/reports/approvals, which is the *opposite* of what the Use Case Diagram specifies — worth fixing before it becomes real seed data (Finding U-3); and (b) there is no login screen or route protection anywhere yet, which is expected for this stage but means Security is currently untested territory, not "passing" (Finding S-1).
- A handful of smaller, concrete bugs are easy fixes whenever Frontend Dev has a spare 30 minutes: the Dashboard's low-stock table is missing its Status column (D-1), the Manage Users role badges don't visually distinguish 3 of the 4 roles (U-2), the Releases page's "low stock" warning uses a made-up formula instead of the item's real status (R-1), and the sample Stock Card ledger's math doesn't actually add up on one row (RP-1).
- Three thesis-document issues (not code) are worth a cleanup pass before this goes in front of a panel: leftover "GSO/Villanueva LGU" text, a Scope section describing a LAN-only PWA when the real system is a cloud web app, and a Software Requirements list naming MySQL/Express when the real stack is Supabase/Next.js.
- The RLS-per-role checklist (Part 4) is ready to execute the moment Backend Dev's schema and auth land — that should be the very next QA pass.
