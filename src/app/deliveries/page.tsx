"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deliveries, inventoryItems } from "@/lib/mock-data";
import type { DeliveryRecord } from "@/lib/types";

interface DraftLine {
  itemName: string;
  qty: number;
  unitCost: number;
}

function nextDeliveryRef(list: DeliveryRecord[]) {
  const nums = list.map((d) => parseInt(d.refNo.split("-").pop() ?? "0", 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `DEL-2024-${String(max + 1).padStart(3, "0")}`;
}

export default function DeliveriesPage() {
  const [deliveryList, setDeliveryList] = useState<DeliveryRecord[]>(deliveries);
  const [lines, setLines] = useState<DraftLine[]>([
    { itemName: "Bond Paper A4", qty: 50, unitCost: 220 },
    { itemName: "Correction Fluid", qty: 30, unitCost: 45 },
  ]);
  const [pendingItem, setPendingItem] = useState(inventoryItems[0].itemName);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingCost, setPendingCost] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [orNumber, setOrNumber] = useState("");
  const [dateDelivered, setDateDelivered] = useState("2024-05-26");
  const [formError, setFormError] = useState("");

  const total = lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);
  const refNo = nextDeliveryRef(deliveryList);

  function addLine() {
    if (!pendingItem || pendingQty <= 0) return;
    setLines((prev) => [...prev, { itemName: pendingItem, qty: pendingQty, unitCost: pendingCost }]);
    setPendingQty(1);
    setPendingCost(0);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function formatDate(iso: string) {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  }

  function saveDelivery() {
    if (!supplier.trim() || lines.length === 0) {
      setFormError("Supplier name and at least one delivery item are required.");
      return;
    }
    const record: DeliveryRecord = {
      refNo,
      supplier: supplier.trim(),
      date: formatDate(dateDelivered),
      itemCount: lines.length,
      items: lines,
      totalCost: total,
    };
    setDeliveryList((prev) => [record, ...prev]);
    setLines([]);
    setSupplier("");
    setOrNumber("");
    setFormError("");
  }

  return (
    <AppShell title="Record deliveries">
      <div className="grid grid-cols-[1.4fr_1fr] gap-3.5">
        <Card>
          <CardHeader title="New delivery record" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery ref. no.">
              <input readOnly value={refNo} className="input" />
            </Field>
            <Field label="Date delivered">
              <input
                type="date"
                value={dateDelivered}
                onChange={(e) => setDateDelivered(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier">
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier name"
                className="input placeholder:text-muted-2"
              />
            </Field>
            <Field label="OR / PO number">
              <input
                value={orNumber}
                onChange={(e) => setOrNumber(e.target.value)}
                placeholder="e.g. OR-00482"
                className="input placeholder:text-muted-2"
              />
            </Field>
          </div>

          <Field label="Received by">
            <select className="input" defaultValue="Juan Dela Cruz">
              <option>Juan Dela Cruz</option>
            </select>
          </Field>

          <div className="mt-1 flex flex-col gap-2.5 border-t border-border-soft pt-3.5">
            <span className="text-xs font-bold text-muted">Delivery items</span>
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
              <Field label="Unit cost" className="w-24">
                <input
                  type="number"
                  min={0}
                  value={pendingCost}
                  onChange={(e) => setPendingCost(Number(e.target.value))}
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
                {lines.map((line, i) => (
                  <div
                    key={`${line.itemName}-${i}`}
                    className={`flex items-center justify-between px-3 py-2 text-[12.5px] ${
                      i !== lines.length - 1 ? "border-b border-border-soft" : ""
                    }`}
                  >
                    <span className="font-medium">{line.itemName}</span>
                    <div className="flex items-center gap-4 text-muted">
                      <span>{line.qty} pcs</span>
                      <span>&#8369;{line.unitCost.toLocaleString()}</span>
                      <span className="font-bold text-foreground">
                        &#8369;{(line.qty * line.unitCost).toLocaleString()}
                      </span>
                      <button onClick={() => removeLine(i)} className="text-critical-text">
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-[12px] font-medium text-critical-text">{formError}</p>
          )}
          <div className="flex items-center justify-between border-t border-border-soft pt-3.5">
            <span className="text-[13px] font-semibold">
              Total: <span className="font-extrabold">&#8369;{total.toLocaleString()}.00</span>
            </span>
            <Button variant="dark" onClick={saveDelivery}>
              Save delivery
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent deliveries"
            action={
              <a href="#" className="text-xs font-semibold text-muted hover:text-foreground">
                View all
              </a>
            }
          />
          <div className="flex flex-col">
            {deliveryList.map((d, i) => (
              <div
                key={d.refNo}
                className={`flex items-center justify-between py-2.5 text-[12.5px] ${
                  i !== deliveryList.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{d.refNo}</span>
                  <span className="text-muted-2">{d.supplier}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-muted">{d.date}</span>
                  <span className="text-muted-2">{d.itemCount} items</span>
                </div>
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
