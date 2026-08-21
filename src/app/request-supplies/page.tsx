"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EndUserShell } from "@/components/layout/EndUserShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, requestStatusTone } from "@/components/ui/Badge";
import { myRequests, inventoryItems } from "@/lib/mock-data";
import type { SupplyRequest } from "@/lib/types";

interface DraftLine {
  itemName: string;
  qty: number;
}

function nextRequestRef(list: SupplyRequest[]) {
  const nums = list.map((r) => parseInt(r.refNo.split("-").pop() ?? "0", 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `REQ-${String(max + 1).padStart(4, "0")}`;
}

export default function RequestSuppliesPage() {
  const [requests, setRequests] = useState<SupplyRequest[]>(myRequests);
  const [lines, setLines] = useState<DraftLine[]>([
    { itemName: "Bond Paper A4", qty: 10 },
    { itemName: "Ballpen (Black)", qty: 24 },
  ]);
  const [pendingItem, setPendingItem] = useState(inventoryItems[0].itemName);
  const [pendingQty, setPendingQty] = useState(1);
  const [selectedRef, setSelectedRef] = useState(requests[0].refNo);
  const [formError, setFormError] = useState("");

  const selected = requests.find((r) => r.refNo === selectedRef) ?? requests[0];

  function addLine() {
    if (!pendingItem || pendingQty <= 0) return;
    setLines((prev) => [...prev, { itemName: pendingItem, qty: pendingQty }]);
    setPendingQty(1);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function submitRequest() {
    if (lines.length === 0) {
      setFormError("Add at least one item before submitting your request.");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
    const record: SupplyRequest = {
      refNo: nextRequestRef(requests),
      date: today,
      itemCount: lines.length,
      status: "Pending",
      items: lines,
    };
    setRequests((prev) => [record, ...prev]);
    setSelectedRef(record.refNo);
    setLines([]);
    setFormError("");
  }

  return (
    <EndUserShell title="Request supplies">
      <div className="grid grid-cols-[1.2fr_1fr] gap-3.5">
        <Card>
          <CardHeader title="New supply request" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select className="input" defaultValue="College of Engineering">
                <option>College of Engineering</option>
                <option>College of Arts</option>
                <option>Finance Office</option>
              </select>
            </Field>
            <Field label="Date needed">
              <input type="date" defaultValue="2024-05-30" className="input" />
            </Field>
          </div>

          <Field label="Purpose">
            <textarea
              rows={2}
              placeholder="State the purpose of your request..."
              className="input h-auto resize-none py-2 placeholder:text-muted-2"
            />
          </Field>

          <div className="mt-1 flex flex-col gap-2.5 border-t border-border-soft pt-3.5">
            <span className="text-xs font-bold text-muted">Requested items</span>
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
                {lines.map((line, i) => (
                  <div
                    key={`${line.itemName}-${i}`}
                    className={`flex items-center justify-between px-3 py-2 text-[12.5px] ${
                      i !== lines.length - 1 ? "border-b border-border-soft" : ""
                    }`}
                  >
                    <span className="font-medium">{line.itemName}</span>
                    <div className="flex items-center gap-3 text-muted">
                      <span>{line.qty} pcs</span>
                      <button onClick={() => removeLine(i)} className="text-critical-text">
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && <p className="text-[12px] font-medium text-critical-text">{formError}</p>}
          <Button variant="dark" className="self-end" onClick={submitRequest}>
            Submit request
          </Button>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card>
            <CardHeader title="My request status" />
            <div className="flex flex-col">
              {requests.map((r, i) => (
                <button
                  key={r.refNo}
                  onClick={() => setSelectedRef(r.refNo)}
                  className={`flex items-center justify-between py-2.5 text-left text-[12.5px] ${
                    i !== requests.length - 1 ? "border-b border-border-soft" : ""
                  } ${r.refNo === selectedRef ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{r.refNo}</span>
                    <span className="text-muted-2">
                      {r.date} &middot; {r.itemCount} items
                    </span>
                  </div>
                  <Badge tone={requestStatusTone(r.status)}>{r.status}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={`${selected.refNo} details`} />
            <div className="flex flex-col gap-2.5 text-[12.5px]">
              <DetailRow label="Status">
                <Badge tone={requestStatusTone(selected.status)}>{selected.status}</Badge>
              </DetailRow>
              <DetailRow label="Approved by" value={selected.approvedBy ?? "—"} />
              <DetailRow label="Approved on" value={selected.approvedOn ?? "—"} />
              <DetailRow label="Remarks" value={selected.remarks ?? "—"} />
            </div>
          </Card>
        </div>
      </div>
    </EndUserShell>
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

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft pb-2.5 last:border-b-0 last:pb-0">
      <span className="text-muted-2">{label}</span>
      {children ?? <span className="font-semibold">{value}</span>}
    </div>
  );
}
