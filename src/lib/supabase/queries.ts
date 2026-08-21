import { createClient } from "@/lib/supabase/server";
import type {
  AccountStatus,
  CategoryStock,
  DeliveryItemLine,
  DeliveryRecord,
  LogEntry,
  PendingRequestSummary,
  RequestStatus,
  RisItemLine,
  RisRecord,
  RoleDefinition,
  StockStatus,
  SupplyRequest,
  SupplyRequestItem,
  SystemUser,
  UserRole,
} from "@/lib/types";

// ---------------------------------------------------------------------
// Real Supabase query helpers, shaped to mirror src/lib/mock-data.ts's
// exports as closely as possible so swapping a page from
// `import { inventoryItems } from "@/lib/mock-data"` to
// `import { getInventoryItems } from "@/lib/supabase/queries"` (+ making
// the enclosing component async) is close to a drop-in change.
//
// NOT WIRED UP YET: no page imports this file this round (see the task
// scope note in the repo — Frontend Dev owns that swap). These functions
// are UNTESTED against the live database (no Supabase MCP access this
// round — see final report), so treat them as a strong starting point,
// not a guarantee. Two things worth double-checking once real access is
// available:
//   1. PostgREST embed hints for the two `releases -> users` foreign keys
//      (requested_by AND approved_by both point at users.id) — the
//      `approver:approved_by(full_name)` alias syntax below is the
//      documented way to disambiguate, but verify against this project's
//      actual PostgREST version.
//   2. There's no generated `Database` type (would need `supabase gen
//      types typescript`, which needs CLI/MCP access to the live schema),
//      so embedded-relation shapes are asserted with local `as`/interface
//      casts rather than fully inferred. Regenerate and swap these out
//      once possible.
// ---------------------------------------------------------------------

/**
 * OK/Low/Critical is NOT stored — items.status in the DB is the item's
 * lifecycle flag (active/inactive/discontinued, see migration 04), not a
 * stock badge. This computes the badge fresh every read so it can never
 * drift out of sync with stock_quantity/reorder_level. Thresholds are a
 * judgment call (below reorder = Low, below half of reorder = Critical) —
 * the old mock-data.ts values were hand-set per row and not perfectly
 * consistent with any single rule, so expect a few items to show a
 * slightly different badge than they did under mock data.
 */
export function computeStockStatus(stockQuantity: number, reorderLevel: number): StockStatus {
  if (stockQuantity <= 0) return "Critical";
  if (reorderLevel > 0 && stockQuantity < reorderLevel) {
    return stockQuantity < reorderLevel * 0.5 ? "Critical" : "Low";
  }
  return "OK";
}

function mapReleaseStatus(status: string): RequestStatus {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "released":
      return "Released";
    default:
      return "Pending";
  }
}

function initialsOf(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------
// Current user / profile
// ---------------------------------------------------------------------

export interface CurrentUserProfile {
  fullName: string;
  initials: string;
  role: UserRole | string;
  department: string | null;
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("full_name, department, roles(name)")
    .eq("id", user.id)
    .single<{ full_name: string; department: string | null; roles: { name: string } | null }>();

  if (!data) return null;

  return {
    fullName: data.full_name,
    initials: initialsOf(data.full_name),
    role: data.roles?.name ?? "Faculty / Staff",
    department: data.department,
  };
}

// ---------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------

interface InventoryRow {
  item_code: string;
  item_name: string;
  unit: string;
  stock_quantity: number;
  reorder_level: number;
  categories: { category_name: string } | null;
}

export async function getInventoryItems() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("item_code, item_name, unit, stock_quantity, reorder_level, categories(category_name)")
    .order("item_code")
    .returns<InventoryRow[]>();

  return (data ?? []).map((row) => ({
    itemCode: row.item_code,
    itemName: row.item_name,
    category: row.categories?.category_name ?? "Uncategorized",
    unit: row.unit,
    onHand: Number(row.stock_quantity),
    reorderLevel: Number(row.reorder_level),
    status: computeStockStatus(Number(row.stock_quantity), Number(row.reorder_level)),
  }));
}

export async function getLowStockItems(limit = 5) {
  const items = await getInventoryItems();
  return items.filter((item) => item.status !== "OK").slice(0, limit);
}

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const [itemCount, items, deliveryCount, risCount] = await Promise.all([
    supabase.from("items").select("item_id", { count: "exact", head: true }),
    getInventoryItems(),
    supabase.from("deliveries").select("delivery_id", { count: "exact", head: true }),
    supabase
      .from("releases")
      .select("release_id", { count: "exact", head: true })
      .in("status", ["approved", "released"]),
  ]);

  return {
    totalItems: itemCount.count ?? 0,
    lowStock: items.filter((item) => item.status !== "OK").length,
    deliveries: deliveryCount.count ?? 0,
    risProcessed: risCount.count ?? 0,
  };
}

export async function getStockByCategory(): Promise<CategoryStock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("stock_quantity, categories(category_name)")
    .returns<{ stock_quantity: number; categories: { category_name: string } | null }[]>();

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const name = row.categories?.category_name ?? "Uncategorized";
    totals.set(name, (totals.get(name) ?? 0) + Number(row.stock_quantity));
  }

  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("category_name, status").order("category_name");
  return (data ?? []).map((row) => ({ name: row.category_name, active: row.status === "active" }));
}

export async function getUnitsOfMeasure() {
  const supabase = await createClient();
  const { data } = await supabase.from("units_of_measure").select("name, abbreviation").order("name");
  return data ?? [];
}

// ---------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------

interface DeliveryRow {
  ref_no: string;
  supplier: string;
  delivery_date: string;
  delivery_items: { quantity: number; unit_cost: number; items: { item_name: string } | null }[] | null;
}

export async function getDeliveries(): Promise<DeliveryRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliveries")
    .select("ref_no, supplier, delivery_date, delivery_items(quantity, unit_cost, items(item_name))")
    .order("delivery_date", { ascending: false })
    .returns<DeliveryRow[]>();

  return (data ?? []).map((row) => {
    const items: DeliveryItemLine[] = (row.delivery_items ?? []).map((line) => ({
      itemName: line.items?.item_name ?? "—",
      qty: Number(line.quantity),
      unitCost: Number(line.unit_cost),
    }));

    return {
      refNo: row.ref_no,
      supplier: row.supplier,
      date: row.delivery_date,
      itemCount: items.length,
      items,
      totalCost: items.reduce((sum, line) => sum + line.qty * line.unitCost, 0),
    };
  });
}

// ---------------------------------------------------------------------
// Releases (unified RIS + Requests — see migration 06)
// ---------------------------------------------------------------------

interface ReleaseRow {
  ris_number: string;
  department: string | null;
  release_date: string | null;
  status: string;
  scio: string | null;
  purpose: string | null;
  remarks: string | null;
  release_items:
    | { quantity: number; items: { item_name: string; stock_quantity: number; reorder_level: number } | null }[]
    | null;
  approver: { full_name: string } | null;
}

/** Officer-facing view: every release/RIS record, newest first. */
export async function getRisRecords(): Promise<RisRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("releases")
    .select(
      "ris_number, department, release_date, status, scio, purpose, release_items(quantity, items(item_name, stock_quantity, reorder_level))",
    )
    .order("created_at", { ascending: false })
    .returns<ReleaseRow[]>();

  return (data ?? []).map((row) => {
    const items: RisItemLine[] = (row.release_items ?? []).map((line) => ({
      itemName: line.items?.item_name ?? "—",
      qtyRequested: Number(line.quantity),
      stockOnHand: Number(line.items?.stock_quantity ?? 0),
      lowStock: Number(line.items?.stock_quantity ?? 0) < Number(line.items?.reorder_level ?? 0),
    }));

    return {
      risNo: row.ris_number,
      department: row.department ?? "—",
      date: row.release_date ?? "",
      status: mapReleaseStatus(row.status),
      scio: row.scio ?? "",
      purpose: row.purpose ?? "",
      items,
    };
  });
}

/** Faculty/Staff-facing view: only the signed-in user's own requests (RLS enforces this too). */
export async function getMyRequests(): Promise<SupplyRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("releases")
    .select(
      "ris_number, release_date, status, remarks, release_items(quantity, items(item_name)), approver:approved_by(full_name)",
    )
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false })
    .returns<ReleaseRow[]>();

  return (data ?? []).map((row) => {
    const items: SupplyRequestItem[] = (row.release_items ?? []).map((line) => ({
      itemName: line.items?.item_name ?? "—",
      qty: Number(line.quantity),
    }));

    return {
      refNo: row.ris_number,
      date: row.release_date ?? "",
      itemCount: items.length,
      status: mapReleaseStatus(row.status),
      items,
      approvedBy: row.approver?.full_name,
      approvedOn: row.status === "approved" ? (row.release_date ?? undefined) : undefined,
      remarks: row.remarks ?? undefined,
    };
  });
}

export async function getPendingRequests(limit = 10): Promise<PendingRequestSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("releases")
    .select("department, status, release_items(quantity, items(item_name, unit))")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        department: string | null;
        status: string;
        release_items: { quantity: number; items: { item_name: string; unit: string } | null }[] | null;
      }[]
    >();

  return (data ?? []).map((row) => {
    const first = row.release_items?.[0];
    return {
      itemName: first?.items?.item_name ?? "—",
      department: row.department ?? "—",
      qty: first ? `${first.quantity} ${first.items?.unit ?? ""}`.trim() : "—",
      status: mapReleaseStatus(row.status),
    };
  });
}

// ---------------------------------------------------------------------
// Users / Roles / Logs (admin screens)
// ---------------------------------------------------------------------

interface UserRow {
  full_name: string;
  email: string;
  department: string | null;
  status: string;
  roles: { name: string } | null;
}

export async function getSystemUsers(): Promise<SystemUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, email, department, status, roles(name)")
    .order("full_name")
    .returns<UserRow[]>();

  return (data ?? []).map((row) => ({
    fullName: row.full_name,
    initials: initialsOf(row.full_name),
    email: row.email,
    role: (row.roles?.name ?? "Faculty / Staff") as UserRole,
    department: row.department ?? "—",
    status: (row.status === "active" ? "Active" : "Inactive") as AccountStatus,
  }));
}

export async function getRoleDefinitions(): Promise<RoleDefinition[]> {
  const supabase = await createClient();

  const [{ data: roles }, { data: permissions }, { data: users }] = await Promise.all([
    supabase.from("roles").select("role_id, name, description"),
    supabase.from("role_permissions").select("role_id, permission_key, allowed"),
    supabase.from("users").select("role_id"),
  ]);

  return (roles ?? []).map((role) => {
    const rolePermissions = (permissions ?? [])
      .filter((p) => p.role_id === role.role_id)
      .reduce<Record<string, boolean>>((acc, p) => {
        acc[p.permission_key] = p.allowed;
        return acc;
      }, {});

    return {
      name: role.name,
      description: role.description ?? "",
      userCount: (users ?? []).filter((u) => u.role_id === role.role_id).length,
      permissions: rolePermissions,
    };
  });
}

export async function getSystemLogs(limit = 200): Promise<LogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_logs")
    .select("created_at, action, module, description, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      { created_at: string; action: string; module: string; description: string | null; users: { full_name: string } | null }[]
    >();

  return (data ?? []).map((row) => ({
    timestamp: row.created_at,
    user: row.users?.full_name ?? "System",
    action: (row.action.charAt(0).toUpperCase() + row.action.slice(1)) as LogEntry["action"],
    module: row.module,
    description: row.description ?? "",
  }));
}
