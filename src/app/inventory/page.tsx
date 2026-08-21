"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Plus, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, stockStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { inventoryItems, dashboardMetrics, categories as categoryRefs, unitsOfMeasure } from "@/lib/mock-data";
import type { InventoryItem, StockStatus } from "@/lib/types";

// Simple business rule for auto-classifying stock status when an item is
// added/edited: below half the reorder level is Critical, at/below the
// reorder level is Low, otherwise OK.
function computeStatus(onHand: number, reorderLevel: number): StockStatus {
  if (reorderLevel <= 0) return "OK";
  if (onHand <= reorderLevel * 0.5) return "Critical";
  if (onHand <= reorderLevel) return "Low";
  return "OK";
}

interface ItemFormState {
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  onHand: string;
  reorderLevel: string;
}

const emptyForm: ItemFormState = {
  itemCode: "",
  itemName: "",
  category: categoryRefs[0]?.name ?? "",
  unit: unitsOfMeasure[0]?.name ?? "",
  onHand: "0",
  reorderLevel: "0",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyForm);

  const categories = ["All categories", ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All categories" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  function nextItemCode() {
    const nums = items.map((i) => parseInt(i.itemCode.split("-").pop() ?? "0", 10));
    const max = nums.length ? Math.max(...nums) : 0;
    return `ITM-${String(max + 1).padStart(4, "0")}`;
  }

  function openAdd() {
    setEditingCode(null);
    setForm({ ...emptyForm, itemCode: nextItemCode() });
    setModalOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingCode(item.itemCode);
    setForm({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      onHand: String(item.onHand),
      reorderLevel: String(item.reorderLevel),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function saveItem() {
    if (!form.itemName.trim()) return;
    const onHand = Number(form.onHand) || 0;
    const reorderLevel = Number(form.reorderLevel) || 0;
    const record: InventoryItem = {
      itemCode: form.itemCode,
      itemName: form.itemName.trim(),
      category: form.category,
      unit: form.unit,
      onHand,
      reorderLevel,
      status: computeStatus(onHand, reorderLevel),
    };

    if (editingCode) {
      setItems((prev) => prev.map((i) => (i.itemCode === editingCode ? record : i)));
    } else {
      setItems((prev) => [record, ...prev]);
    }
    setModalOpen(false);
  }

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
          <Button variant="dark" onClick={openAdd}>
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
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex size-7 items-center justify-center rounded-md border border-border text-[#52525b] hover:bg-background"
                    >
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCode ? `Edit item — ${editingCode}` : "Add item"}
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item code">
              <input readOnly value={form.itemCode} className="input" />
            </Field>
            <Field label="Item name">
              <input
                value={form.itemName}
                onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                placeholder="e.g. Bond Paper A4"
                className="input placeholder:text-muted-2"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input"
              >
                {categoryRefs.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit of measure">
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="input"
              >
                {unitsOfMeasure.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity on hand">
              <input
                type="number"
                min={0}
                value={form.onHand}
                onChange={(e) => setForm((f) => ({ ...f, onHand: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Reorder level">
              <input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                className="input"
              />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-soft bg-background px-3 py-2.5 text-[12.5px]">
            <span className="text-muted">Resulting status</span>
            <Badge tone={stockStatusTone(computeStatus(Number(form.onHand) || 0, Number(form.reorderLevel) || 0))}>
              {computeStatus(Number(form.onHand) || 0, Number(form.reorderLevel) || 0)}
            </Badge>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="dark" onClick={saveItem}>
            {editingCode ? "Save changes" : "Add item"}
          </Button>
        </ModalFooter>
      </Modal>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}
