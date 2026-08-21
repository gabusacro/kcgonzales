export type StockStatus = "OK" | "Low" | "Critical";

export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Released";

export type UserRole = "Admin" | "Supply Officer" | "Faculty" | "Staff";

export type AccountStatus = "Active" | "Inactive";

export interface InventoryItem {
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  status: StockStatus;
}

export interface DeliveryItemLine {
  itemName: string;
  qty: number;
  unitCost: number;
}

export interface DeliveryRecord {
  refNo: string;
  supplier: string;
  date: string;
  itemCount: number;
  items: DeliveryItemLine[];
  totalCost: number;
}

export interface RisItemLine {
  itemName: string;
  qtyRequested: number;
  stockOnHand: number;
  lowStock: boolean;
}

export interface RisRecord {
  risNo: string;
  department: string;
  date: string;
  status: RequestStatus;
  scio: string;
  purpose: string;
  items: RisItemLine[];
}

export interface SupplyRequestItem {
  itemName: string;
  qty: number;
}

export interface SupplyRequest {
  refNo: string;
  date: string;
  itemCount: number;
  status: RequestStatus;
  items: SupplyRequestItem[];
  approvedBy?: string;
  approvedOn?: string;
  remarks?: string;
}

export interface SystemUser {
  fullName: string;
  initials: string;
  email: string;
  role: UserRole;
  department: string;
  status: AccountStatus;
}

export interface RoleDefinition {
  name: string;
  description: string;
  userCount: number;
  permissions: Record<string, boolean>;
}

export interface LogEntry {
  timestamp: string;
  user: string;
  action: "Create" | "Login" | "Update" | "Delete";
  module: string;
  description: string;
}

export interface CategoryStock {
  name: string;
  value: number;
}

export interface PendingRequestSummary {
  itemName: string;
  department: string;
  qty: string;
  status: RequestStatus;
}
