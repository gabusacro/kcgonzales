"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Plus, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, stockStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inventoryItems, dashboardMetrics } from "@/lib/mock-data";

const categories = ["All categories", ...Array.from(new Set(inventoryItems.map((i) => i.category)))];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All categories" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <AppShell title="Inventory management">
      <div className="grid grid-cols-3 gap-3.5">
        <StatCard label="Total items" value={dashboardMetrics.totalItems} hint="all categories" />
        <StatCard
          label="Low stock"
          value={dashboardMetrics.lowStock}
          hint="below reorder"
          valueClassName="text-low-text"
        />
        <StatCard label="Categories" value={categories.length - 1} hint="active" />
      </div>

      <Card>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9.5 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search size={15} strokeWidth={1.8} className="text-muted-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
            />
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9.5 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-[13px] font-medium text-[#3f3f46] outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={1.8}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-2"
            />
          </div>
          <Button variant="dark">
            <Plus size={14} strokeWidth={2} />
            Add item
          </Button>
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Item code", "Item name", "Category", "Unit", "On hand", "Reorder lvl", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-border px-3 pb-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-2 first:pl-0"
                  >
                    {h}
                  </th>
                ),
              )}
              <th className="border-b border-border px-3 pb-2 text-right text-[11px] font-bold uppercase tracking-wider text-muted-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const last = i === filtered.length - 1;
              const cell = `px-3 py-2.5 ${last ? "" : "border-b border-border-soft"}`;
              return (
                <tr key={item.itemCode}>
                  <td className={`${cell} pl-0 text-muted`}>{item.itemCode}</td>
                  <td className={`${cell} font-semibold`}>{item.itemName}</td>
                  <td className={`${cell} text-muted`}>{item.category}</td>
                  <td className={`${cell} text-muted`}>{item.unit}</td>
                  <td className={`${cell} font-bold`}>{item.onHand}</td>
                  <td className={`${cell} text-muted`}>{item.reorderLevel}</td>
                  <td className={cell}>
                    <Badge tone={stockStatusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <button className="inline-flex size-7 items-center justify-center rounded-md border border-border text-[#52525b] hover:bg-background">
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-2">
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-2">
            Showing {filtered.length} of {dashboardMetrics.totalItems} items
          </span>
          <div className="flex items-center gap-1.5">
            <button className="flex size-7 items-center justify-center rounded-md border border-border text-muted-2 hover:bg-background">
              <ChevronLeft size={13} strokeWidth={2} />
            </button>
            <button className="flex size-7 items-center justify-center rounded-md border border-foreground bg-foreground text-xs font-bold text-white">
              1
            </button>
            <button className="flex size-7 items-center justify-center rounded-md border border-border text-xs font-semibold text-[#3f3f46] hover:bg-background">
              2
            </button>
            <button className="flex size-7 items-center justify-center rounded-md border border-border text-xs font-semibold text-[#3f3f46] hover:bg-background">
              3
            </button>
            <button className="flex size-7 items-center justify-center rounded-md border border-border text-[#3f3f46] hover:bg-background">
              <ChevronRight size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
