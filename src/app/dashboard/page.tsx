import { Package, AlertTriangle, Truck, FileCheck, Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, requestStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  dashboardMetrics,
  stockByCategory,
  pendingRequests,
  lowStockItems,
} from "@/lib/mock-data";

const barTones = ["#18181b", "#3f3f46", "#71717a", "#a1a1a6", "#d4d4d8"];

export default function DashboardPage() {
  const maxValue = Math.max(...stockByCategory.map((c) => c.value));

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard
          label="Total items"
          value={dashboardMetrics.totalItems}
          hint="across all categories"
          icon={Package}
        />
        <StatCard
          label="Low stock"
          value={dashboardMetrics.lowStock}
          hint="items below reorder level"
          icon={AlertTriangle}
          valueClassName="text-low-text"
        />
        <StatCard
          label="Deliveries"
          value={dashboardMetrics.deliveries}
          hint="received this month"
          icon={Truck}
        />
        <StatCard
          label="RIS processed"
          value={dashboardMetrics.risProcessed}
          hint="releases this month"
          icon={FileCheck}
        />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card>
          <CardHeader
            title="Stock by category"
            action={
              <a href="#" className="text-xs font-semibold text-muted hover:text-foreground">
                View all
              </a>
            }
          />
          <div className="flex flex-col gap-3">
            {stockByCategory.map((c, i) => (
              <div key={c.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-[#3f3f46]">{c.name}</span>
                  <span className="font-bold">{c.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.value / maxValue) * 100}%`,
                      backgroundColor: barTones[i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pending supply requests"
            action={
              <a href="#" className="text-xs font-semibold text-muted hover:text-foreground">
                View all
              </a>
            }
          />
          <div className="flex flex-col">
            {pendingRequests.map((r, i) => (
              <div
                key={r.itemName}
                className={`flex items-center justify-between py-2.5 ${
                  i !== pendingRequests.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold">{r.itemName}</span>
                  <span className="text-[11.5px] text-muted-2">
                    {r.department} &middot; {r.qty}
                  </span>
                </div>
                <Badge tone={requestStatusTone(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Low stock items"
          action={
            <div className="flex gap-2">
              <Button variant="outline">
                <Download size={14} strokeWidth={1.8} />
                Export
              </Button>
              <Button variant="dark">Manage inventory</Button>
            </div>
          }
        />
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Item code", "Item name", "Category", "Unit", "On hand", "Reorder lvl"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-border px-3 pb-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-2 first:pl-0"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item, i) => (
              <tr key={item.itemCode} className="hover:bg-background/60">
                <td
                  className={`px-3 py-2.5 pl-0 text-muted ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.itemCode}
                </td>
                <td
                  className={`px-3 py-2.5 font-semibold ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.itemName}
                </td>
                <td
                  className={`px-3 py-2.5 text-muted ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.category}
                </td>
                <td
                  className={`px-3 py-2.5 text-muted ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.unit}
                </td>
                <td
                  className={`px-3 py-2.5 font-bold ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.onHand}
                </td>
                <td
                  className={`px-3 py-2.5 text-muted ${
                    i !== lowStockItems.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  {item.reorderLevel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
