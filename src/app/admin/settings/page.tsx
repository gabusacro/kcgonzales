"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { categories, unitsOfMeasure } from "@/lib/mock-data";

interface Category {
  name: string;
  active: boolean;
}

interface UnitOfMeasure {
  name: string;
  abbreviation: string;
}

export default function SystemSettingsPage() {
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [unitList, setUnitList] = useState<UnitOfMeasure[]>(unitsOfMeasure);
  const [savedNotice, setSavedNotice] = useState(false);

  const [categoryModal, setCategoryModal] = useState<{
    index: number | null;
    name: string;
    active: boolean;
  } | null>(null);

  const [unitModal, setUnitModal] = useState<{
    index: number | null;
    name: string;
    abbreviation: string;
  } | null>(null);

  function saveChanges() {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }

  function saveCategory() {
    if (!categoryModal || !categoryModal.name.trim()) return;
    const record: Category = { name: categoryModal.name.trim(), active: categoryModal.active };
    if (categoryModal.index === null) {
      setCategoryList((prev) => [...prev, record]);
    } else {
      setCategoryList((prev) => prev.map((c, i) => (i === categoryModal.index ? record : c)));
    }
    setCategoryModal(null);
  }

  function saveUnit() {
    if (!unitModal || !unitModal.name.trim() || !unitModal.abbreviation.trim()) return;
    const record: UnitOfMeasure = {
      name: unitModal.name.trim(),
      abbreviation: unitModal.abbreviation.trim(),
    };
    if (unitModal.index === null) {
      setUnitList((prev) => [...prev, record]);
    } else {
      setUnitList((prev) => prev.map((u, i) => (i === unitModal.index ? record : u)));
    }
    setUnitModal(null);
  }

  return (
    <AppShell title="System settings">
      <div className="grid grid-cols-[1.1fr_1fr] gap-3.5">
        <Card>
          <CardHeader title="General settings" />

          <Field label="Institution name">
            <input
              defaultValue="University of Science and Technology of Southern Philippines"
              className="input"
            />
          </Field>
          <Field label="System title">
            <input defaultValue="Supply and Property Management System" className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fiscal year start">
              <select className="input" defaultValue="January">
                <option>January</option>
                <option>July</option>
              </select>
            </Field>
            <Field label="Currency">
              <select className="input" defaultValue="Philippine Peso (₱)">
                <option>Philippine Peso (₱)</option>
              </select>
            </Field>
          </div>

          <Field label="Low-stock notification threshold (%)">
            <input type="number" defaultValue={20} className="input" />
          </Field>

          <div className="flex items-center justify-end gap-2.5">
            {savedNotice && <span className="text-[12px] font-medium text-ok-text">Saved.</span>}
            <Button variant="dark" className="self-end" onClick={saveChanges}>
              Save changes
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-bold">Categories</span>
              <button
                onClick={() => setCategoryModal({ index: null, name: "", active: true })}
                className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
              >
                <Plus size={13} strokeWidth={2} />
                Add
              </button>
            </div>
            <div className="flex flex-col">
              {categoryList.map((c, i) => (
                <div
                  key={c.name}
                  className={`flex items-center justify-between py-2.5 text-[13px] ${
                    i !== categoryList.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <Badge tone={c.active ? "ok" : "neutral"}>{c.active ? "Active" : "Inactive"}</Badge>
                    <button
                      onClick={() => setCategoryModal({ index: i, name: c.name, active: c.active })}
                      className="text-muted-2 hover:text-foreground"
                    >
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-bold">Units of measure</span>
              <button
                onClick={() => setUnitModal({ index: null, name: "", abbreviation: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
              >
                <Plus size={13} strokeWidth={2} />
                Add
              </button>
            </div>
            <div className="flex flex-col">
              {unitList.map((u, i) => (
                <div
                  key={u.name}
                  className={`flex items-center justify-between py-2.5 text-[13px] ${
                    i !== unitList.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  <span className="font-medium">{u.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-2">{u.abbreviation}</span>
                    <button
                      onClick={() => setUnitModal({ index: i, name: u.name, abbreviation: u.abbreviation })}
                      className="text-muted-2 hover:text-foreground"
                    >
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={categoryModal !== null}
        onClose={() => setCategoryModal(null)}
        title={categoryModal?.index === null ? "Add category" : "Edit category"}
      >
        {categoryModal && (
          <>
            <div className="flex flex-col gap-3">
              <Field label="Category name">
                <input
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                  placeholder="e.g. Office Supplies"
                  className="input placeholder:text-muted-2"
                />
              </Field>
              <Field label="Status">
                <select
                  value={categoryModal.active ? "Active" : "Inactive"}
                  onChange={(e) =>
                    setCategoryModal({ ...categoryModal, active: e.target.value === "Active" })
                  }
                  className="input"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setCategoryModal(null)}>
                Cancel
              </Button>
              <Button variant="dark" onClick={saveCategory}>
                {categoryModal.index === null ? "Add category" : "Save changes"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal
        open={unitModal !== null}
        onClose={() => setUnitModal(null)}
        title={unitModal?.index === null ? "Add unit of measure" : "Edit unit of measure"}
      >
        {unitModal && (
          <>
            <div className="flex flex-col gap-3">
              <Field label="Unit name">
                <input
                  value={unitModal.name}
                  onChange={(e) => setUnitModal({ ...unitModal, name: e.target.value })}
                  placeholder="e.g. Bottle"
                  className="input placeholder:text-muted-2"
                />
              </Field>
              <Field label="Abbreviation">
                <input
                  value={unitModal.abbreviation}
                  onChange={(e) => setUnitModal({ ...unitModal, abbreviation: e.target.value })}
                  placeholder="e.g. btl"
                  className="input placeholder:text-muted-2"
                />
              </Field>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setUnitModal(null)}>
                Cancel
              </Button>
              <Button variant="dark" onClick={saveUnit}>
                {unitModal.index === null ? "Add unit" : "Save changes"}
              </Button>
            </ModalFooter>
          </>
        )}
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
