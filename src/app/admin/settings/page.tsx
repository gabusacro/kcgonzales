import { Plus, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { categories, unitsOfMeasure } from "@/lib/mock-data";

export default function SystemSettingsPage() {
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

          <Button variant="dark" className="self-end">
            Save changes
          </Button>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-bold">Categories</span>
              <button className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground">
                <Plus size={13} strokeWidth={2} />
                Add
              </button>
            </div>
            <div className="flex flex-col">
              {categories.map((c, i) => (
                <div
                  key={c.name}
                  className={`flex items-center justify-between py-2.5 text-[13px] ${
                    i !== categories.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <Badge tone={c.active ? "ok" : "neutral"}>{c.active ? "Active" : "Inactive"}</Badge>
                    <button className="text-muted-2 hover:text-foreground">
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
              <button className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground">
                <Plus size={13} strokeWidth={2} />
                Add
              </button>
            </div>
            <div className="flex flex-col">
              {unitsOfMeasure.map((u, i) => (
                <div
                  key={u.name}
                  className={`flex items-center justify-between py-2.5 text-[13px] ${
                    i !== unitsOfMeasure.length - 1 ? "border-b border-border-soft" : ""
                  }`}
                >
                  <span className="font-medium">{u.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-2">{u.abbreviation}</span>
                    <button className="text-muted-2 hover:text-foreground">
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
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
