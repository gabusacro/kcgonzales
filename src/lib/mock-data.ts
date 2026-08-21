import type {
  CategoryStock,
  DeliveryRecord,
  InventoryItem,
  LogEntry,
  PendingRequestSummary,
  RisRecord,
  RoleDefinition,
  SupplyRequest,
  SystemUser,
} from "./types";

// Placeholder data for the visual build. Every list here is shaped to match
// the thesis mockups (Figures 3.1-3.10) and is meant to be swapped for real
// Supabase queries once the schema + RLS are wired up.

export const currentUser = {
  fullName: "Juan Dela Cruz",
  initials: "JD",
  role: "Supply Officer",
};

export const dashboardMetrics = {
  totalItems: 248,
  lowStock: 14,
  deliveries: 6,
  risProcessed: 31,
};

export const stockByCategory: CategoryStock[] = [
  { name: "Office Supplies", value: 92 },
  { name: "Janitorial", value: 55 },
  { name: "IT Supplies", value: 47 },
  { name: "Medical", value: 38 },
  { name: "Electrical", value: 26 },
];

export const pendingRequests: PendingRequestSummary[] = [
  { itemName: "Bond Paper (Short)", department: "Dept. of Engineering", qty: "10 reams", status: "Pending" },
  { itemName: "Whiteboard Markers", department: "College of Arts", qty: "24 pcs", status: "Approved" },
  { itemName: "Staple Wire", department: "Finance Office", qty: "5 boxes", status: "Pending" },
  { itemName: "Ink Cartridge (Black)", department: "MIS Department", qty: "3 pcs", status: "Pending" },
];

export const inventoryItems: InventoryItem[] = [
  { itemCode: "ITM-0041", itemName: "Bond Paper A4", category: "Office Supplies", unit: "Ream", onHand: 3, reorderLevel: 10, status: "Critical" },
  { itemCode: "ITM-0055", itemName: "Correction Fluid", category: "Office Supplies", unit: "Pc", onHand: 7, reorderLevel: 15, status: "Low" },
  { itemCode: "ITM-0067", itemName: "Staple Wire", category: "Office Supplies", unit: "Box", onHand: 22, reorderLevel: 10, status: "OK" },
  { itemCode: "ITM-0089", itemName: "Broom (Soft)", category: "Janitorial", unit: "Pc", onHand: 2, reorderLevel: 5, status: "Critical" },
  { itemCode: "ITM-0102", itemName: "Alcohol 70%", category: "Medical", unit: "Bottle", onHand: 18, reorderLevel: 20, status: "Low" },
  { itemCode: "ITM-0117", itemName: "Extension Cord 3m", category: "Electrical", unit: "Pc", onHand: 3, reorderLevel: 5, status: "OK" },
  { itemCode: "ITM-0124", itemName: "Bond Paper Short", category: "Office Supplies", unit: "Ream", onHand: 41, reorderLevel: 15, status: "OK" },
  { itemCode: "ITM-0139", itemName: "Trash Bag (Large)", category: "Janitorial", unit: "Pack", onHand: 9, reorderLevel: 12, status: "Low" },
];

export const lowStockItems: InventoryItem[] = inventoryItems.filter(
  (item) => item.status !== "OK",
).slice(0, 5);

export const deliveries: DeliveryRecord[] = [
  {
    refNo: "DEL-2024-082",
    supplier: "ABC Supplies Corp.",
    date: "May 24, 2024",
    itemCount: 3,
    totalCost: 12350,
    items: [
      { itemName: "Bond Paper A4", qty: 50, unitCost: 220 },
      { itemName: "Correction Fluid", qty: 30, unitCost: 45 },
    ],
  },
  { refNo: "DEL-2024-081", supplier: "XYZ Trading", date: "May 21, 2024", itemCount: 5, totalCost: 8400, items: [] },
  { refNo: "DEL-2024-080", supplier: "Metro Office Depot", date: "May 18, 2024", itemCount: 2, totalCost: 3200, items: [] },
  { refNo: "DEL-2024-079", supplier: "ABC Supplies Corp.", date: "May 15, 2024", itemCount: 7, totalCost: 15600, items: [] },
  { refNo: "DEL-2024-078", supplier: "Delta Hardware", date: "May 10, 2024", itemCount: 4, totalCost: 6100, items: [] },
];

export const risRecords: RisRecord[] = [
  {
    risNo: "RIS-2024-0218",
    department: "Finance",
    date: "May 25, 2024",
    status: "Approved",
    scio: "Main Campus",
    purpose: "Monthly office supply restock for the Finance Office.",
    items: [
      { itemName: "Bond Paper A4", qtyRequested: 10, stockOnHand: 3, lowStock: true },
      { itemName: "Staple Wire", qtyRequested: 2, stockOnHand: 22, lowStock: false },
    ],
  },
  { risNo: "RIS-2024-0217", department: "MIS", date: "May 24, 2024", status: "Approved", scio: "Main Campus", purpose: "", items: [] },
  { risNo: "RIS-2024-0216", department: "Engineering", date: "May 23, 2024", status: "Approved", scio: "Main Campus", purpose: "", items: [] },
  { risNo: "RIS-2024-0215", department: "HR", date: "May 22, 2024", status: "Approved", scio: "Main Campus", purpose: "", items: [] },
  { risNo: "RIS-2024-0214", department: "Arts", date: "May 21, 2024", status: "Pending", scio: "Main Campus", purpose: "", items: [] },
];

export const stockCardLedger = [
  { date: "May 01", reference: "Opening balance", receiptQty: null as number | null, issueQty: null as number | null, balance: 20 },
  { date: "May 05", reference: "DEL-2024-082", receiptQty: 50, issueQty: null, balance: 70 },
  { date: "May 08", reference: "RIS-2024-0218", receiptQty: null, issueQty: 20, balance: 50 },
  { date: "May 15", reference: "RIS-2024-0224", receiptQty: 30, issueQty: null, balance: 20 },
  { date: "May 20", reference: "RIS-2024-0229", receiptQty: null, issueQty: 17, balance: 3 },
];

export const myRequests: SupplyRequest[] = [
  {
    refNo: "REQ-0091",
    date: "May 24, 2024",
    itemCount: 2,
    status: "Approved",
    items: [
      { itemName: "Bond Paper A4", qty: 10 },
      { itemName: "Ballpen (Black)", qty: 24 },
    ],
    approvedBy: "Juan Dela Cruz",
    approvedOn: "May 25, 2024",
    remarks: "Ready for pickup",
  },
  { refNo: "REQ-0088", date: "May 20, 2024", itemCount: 1, status: "Pending", items: [] },
  { refNo: "REQ-0084", date: "May 14, 2024", itemCount: 3, status: "Approved", items: [] },
  { refNo: "REQ-0079", date: "May 08, 2024", itemCount: 2, status: "Approved", items: [] },
];

export const systemUsers: SystemUser[] = [
  { fullName: "System Admin", initials: "AD", email: "admin@school.edu.ph", role: "Admin", department: "All", status: "Active" },
  { fullName: "Juan Dela Cruz", initials: "JD", email: "jdelacruz@school.edu.ph", role: "Supply Officer", department: "Main Campus", status: "Active" },
  { fullName: "Ana Mercado", initials: "AM", email: "amercado@school.edu.ph", role: "Faculty", department: "Engineering", status: "Active" },
  { fullName: "Ramon Santos", initials: "RS", email: "rsantos@school.edu.ph", role: "Staff", department: "Finance", status: "Inactive" },
];

export const roleDefinitions: RoleDefinition[] = [
  {
    name: "Admin",
    description: "Full system access",
    userCount: 1,
    permissions: {
      "Manage inventory": true,
      "Record deliveries": true,
      "Process RIS": true,
      "Generate reports": true,
      "Manage users": true,
      "System settings": true,
      "View system logs": true,
      "Approve requests": true,
    },
  },
  {
    name: "Supply Officer",
    description: "Manage inventory, deliveries, RIS",
    userCount: 3,
    permissions: {
      "Manage inventory": true,
      "Record deliveries": true,
      "Process RIS": true,
      "Generate reports": true,
      "Manage users": false,
      "System settings": false,
      "View system logs": false,
      "Approve requests": true,
    },
  },
  {
    name: "Faculty / Staff",
    description: "Request and view status only",
    userCount: 48,
    permissions: {
      "Manage inventory": false,
      "Record deliveries": false,
      "Process RIS": false,
      "Generate reports": false,
      "Manage users": false,
      "System settings": false,
      "View system logs": false,
      "Approve requests": false,
    },
  },
];

export const systemLogs: LogEntry[] = [
  { timestamp: "May 26, 09:14", user: "Juan Dela Cruz", action: "Create", module: "Deliveries", description: "Recorded delivery DEL-2024-082" },
  { timestamp: "May 26, 08:02", user: "Juan Dela Cruz", action: "Login", module: "Auth", description: "User logged in successfully" },
  { timestamp: "May 25, 16:41", user: "Juan Dela Cruz", action: "Update", module: "RIS", description: "Approved RIS-2024-0218" },
  { timestamp: "May 25, 11:20", user: "Ana Mercado", action: "Create", module: "Requests", description: "Submitted supply request REQ-0091" },
  { timestamp: "May 24, 14:55", user: "System Admin", action: "Delete", module: "Users", description: "Deactivated user Ramon Santos" },
  { timestamp: "May 24, 10:10", user: "Juan Dela Cruz", action: "Update", module: "Inventory", description: "Updated stock level for ITM-0041" },
];

export const categories = [
  { name: "Office Supplies", active: true },
  { name: "Janitorial", active: true },
  { name: "Medical", active: true },
  { name: "Electrical", active: false },
];

export const unitsOfMeasure = [
  { name: "Piece", abbreviation: "pc" },
  { name: "Ream", abbreviation: "rm" },
  { name: "Box", abbreviation: "bx" },
];
