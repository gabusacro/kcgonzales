"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Download, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, requestStatusTone } from "@/components/ui/Badge";
import { risRecords, inventoryItems } from "@/lib/mock-data";

interface DraftLine {
  itemName: string;
  qty: number;
  stock: number;
}

export default function ReleasesPage() {
  const [lines, setLines] = useState<DraftLine[]>([
    { itemName: "Bond Paper A4", qty: 10, stock: 3 },
    { itemName: "Staple Wire", qty: 2, stock: 22 },
  ]);
  const [pendingItem, setPendingItem] = useState(inventoryItems[0].itemName);
  const [pendingQty, setPendingQty] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All status");

  function addLine() {
    const item = inventoryItems.find((i) => i.itemName === pendingItem);
    if (!item || pendingQty <= 0) return;
    setLines((prev) => [...prev, { itemName: item.itemName, qty: pendingQty, stock: item.onHand }]);
    setPendingQty(1);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const filteredHistory = risRecords.filter(
    (r) => statusFilter === "All status" || r.status === statusFilter,
  );

  return (
    <AppShell title="Process consumable release (RIS)">
      <div className="grid grid-cols-[1.4fr_1fr] gap-3.5">
        <Card>
          <CardHeader title="New RIS form" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="RIS number">
              <input readOnly value="RIS-2024-0219" className="input" />
            </Field>
            <Field label="Release date">
              <input type="date" defaultValue="2024-05-26" className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Requested by (dept.)">
              <select className="input" defaultValue="College of Engineering">
                <option>College of Engineering</option>
                <option>College of Arts</option>
                <option>Finance Office</option>
              </select>
            </Field>
            <Field label="SCIO">
              <select className="input" defaultValue="Main Campus">
                <option>Main Campus</option>
                <option>Villanueva Campus</option>
              </select>
            </Field>
          </div>

          <Field label="Purpose">
            <textarea
              rows={2}
              placeholder="State the purpose of this release..."
              className="input h-auto resize-none py-2 placeholder:text-muted-2"
            />
          </Field>

          <div className="mt-1 flex flex-col gap-2.5 border-t border-border-soft pt-3.5">
            <span className="text-xs font-bold text-muted">Items to release</span>
            <div className="flex items-end gap-2">
              <Field label="Item" className="flex-1">
                <select
                  value={pendingItem}
                  onChange={(e) => setPendingItem(e.target.value)}
                  className="input"
                >
                  {inventoryItems.map((i) => (
                    <option key={i.itemCode} value={i.itemName}>
                      {i.itemName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Qty" className="w-20">
                <input
                  type="number"
                  min={1}
                  value={pendingQty}
                  onChange={(e) => setPendingQty(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <button
                onClick={addLine}
                className="mb-0.5 flex size-9.5 shrink-0 items-center justify-center rounded-lg bg-foreground text-white hover:bg-black"
              >
                <Plus size={16} strokeWidth={2} />
              </button>
            </div>

            {lines.length > 0 && (
              <div className="flex flex-col rounded-lg border border-border-soft">
                {lines.map((line, i) => {
                  const low = line.stock < line.qty * 2;
                  return (
                    <div
                      key={`${line.itemName}-${i}`}
                      className={`flex items-center justify-between px-3 py-2 text-[12.5px] ${
                        i !== lines.length - 1 ? "border-b border-border-soft" : ""
                      }`}
                    >
                      <span className="font-medium">{line.itemName}</span>
                      <div className="flex items-center gap-3 text-muted">
                        <span>Qty req. {line.qty}</span>
                        <span className="flex items-center gap-1">
                          Stock {line.stock}
                          {low && <AlertTriangle size={13} className="text-low-text" />}
                        </span>
                        <button onClick={() => removeLine(i)} className="text-critical-text">
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-soft pt-3.5">
            <Button variant="outline">Save draft</Button>
            <Button variant="dark">Submit for approval</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold">RIS history</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 appearance-none rounded-lg border border-border bg-surface pl-2.5 pr-7 text-[12px] font-medium outline-none"
                >
                  <option>All status</option>
                  <option>Pending</option>
                  <option>Approved</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-2"
                />
              </div>
              <button className="flex size-8 items-center justify-center rounded-lg border border-border text-[#52525b] hover:bg-background">
                <Download size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            {filteredHistory.map((r, i) => (
              <div
                key={r.risNo}
                className={`flex items-center justify-between py-2.5 text-[12.5px] ${
                  i !== filteredHistory.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{r.risNo}</span>
                  <span className="text-muted-2">
                    {r.department} &middot; {r.date}
                  </span>
                </div>
                <Badge tone={requestStatusTone(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-semibold text-muted ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}
