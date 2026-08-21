"use client";

import { useState } from "react";
import { Plus, Trash2, Download, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, requestStatusTone, stockStatusTone } from "@/components/ui/Badge";
import { risRecords, inventoryItems } from "@/lib/mock-data";
import type { RisRecord, StockStatus } from "@/lib/types";

interface DraftLine {
  itemName: string;
  qty: number;
  stock: number;
  stockStatus: StockStatus;
}

function nextRisNo(list: RisRecord[]) {
  const nums = list.map((r) => parseInt(r.risNo.split("-").pop() ?? "0", 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `RIS-2024-${String(max + 1).padStart(4, "0")}`;
}

export default function ReleasesPage() {
  const [risList, setRisList] = useState<RisRecord[]>(risRecords);
  const [lines, setLines] = useState<DraftLine[]>([
    { itemName: "Bond Paper A4", qty: 10, stock: 3, stockStatus: "Critical" },
    { itemName: "Staple Wire", qty: 2, stock: 22, stockStatus: "OK" },
  ]);
  const [pendingItem, setPendingItem] = useState(inventoryItems[0].itemName);
  const [pendingQty, setPendingQty] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All status");
  const [department, setDepartment] = useState("College of Engineering");
  const [scio, setScio] = useState("Main Campus");
  const [purpose, setPurpose] = useState("");
  const [releaseDate, setReleaseDate] = useState("2024-05-26");
  const [formError, setFormError] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);

  const risNo = nextRisNo(risList);

  function addLine() {
    const item = inventoryItems.find((i) => i.itemName === pendingItem);
    if (!item || pendingQty <= 0) return;
    setLines((prev) => [
      ...prev,
      { itemName: item.itemName, qty: pendingQty, stock: item.onHand, stockStatus: item.status },
    ]);
    setPendingQty(1);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function formatDate(iso: string) {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  }

  function resetForm() {
    setLines([]);
    setPurpose("");
    setFormError("");
  }

  function saveDraft() {
    setDraftNotice(true);
    setTimeout(() => setDraftNotice(false), 2000);
  }

  function submitForApproval() {
    if (lines.length === 0) {
      setFormError("Add at least one item to release before submitting.");
      return;
    }
    const record: RisRecord = {
      risNo,
      department,
      date: formatDate(releaseDate),
      status: "Pending",
      scio,
      purpose,
      items: lines.map((l) => ({
        itemName: l.itemName,
        qtyRequested: l.qty,
        stockOnHand: l.stock,
        lowStock: l.stockStatus !== "OK",
      })),
    };
    setRisList((prev) => [record, ...prev]);
    resetForm();
  }

  function exportHistoryCsv() {
    const header = "RIS No,Department,Date,Status\n";
    const rows = filteredHistory.map((r) => `${r.risNo},${r.department},${r.date},${r.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ris-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredHistory = risList.filter(
    (r) => statusFilter === "All status" || r.status === statusFilter,
  );

  return (
    <AppShell title="Process consumable release (RIS)">
      <div className="grid grid-cols-[1.4fr_1fr] gap-3.5">
        <Card>
          <CardHeader title="New RIS form" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="RIS number">
              <input readOnly value={risNo} className="input" />
            </Field>
            <Field label="Release date">
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Requested by (dept.)">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input"
              >
                <option>College of Engineering</option>
                <option>College of Arts</option>
                <option>Finance Office</option>
              </select>
            </Field>
            <Field label="SCIO">
              <select value={scio} onChange={(e) => setScio(e.target.value)} className="input">
                <option>Main Campus</option>
                <option>Villanueva Campus</option>
              </select>
            </Field>
          </div>

          <Field label="Purpose">
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
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
                {lines.map((line, i) => (
                  <div
                    key={`${line.itemName}-${i}`}
                    className={`flex items-center justify-between px-3 py-2 text-[12.5px] ${
                      i !== lines.length - 1 ? "border-b border-border-soft" : ""
                    }`}
                  >
                    <span className="font-medium">{line.itemName}</span>
                    <div className="flex items-center gap-3 text-muted">
                      <span>Qty req. {line.qty}</span>
                      <span>Stock {line.stock}</span>
                      {line.stockStatus !== "OK" && (
                        <Badge tone={stockStatusTone(line.stockStatus)} className="!px-2 !py-0.5">
                          {line.stockStatus}
                        </Badge>
                      )}
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
          <div className="flex items-center justify-end gap-2 border-t border-border-soft pt-3.5">
            {draftNotice && (
              <span className="mr-auto text-[12px] font-medium text-ok-text">Draft saved.</span>
            )}
            <Button variant="outline" onClick={saveDraft}>
              Save draft
            </Button>
            <Button variant="dark" onClick={submitForApproval}>
              Submit for approval
            </Button>
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
                  <option>Rejected</option>
                  <option>Released</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-2"
                />
              </div>
              <button
                onClick={exportHistoryCsv}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-[#52525b] hover:bg-background"
              >
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
