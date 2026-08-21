"use client";

import { useState } from "react";
import {
  Smartphone,
  FileText,
  CalendarRange,
  Building2,
  History,
  Printer,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { stockCardLedger } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const reportTypes = [
  { id: "stock-card", label: "Stock card", hint: "Per item ledger", icon: Smartphone },
  { id: "ris-form", label: "RIS / release form", hint: "Printable form", icon: FileText },
  { id: "period", label: "Monthly / quarterly", hint: "Period summary", icon: CalendarRange },
  { id: "scio", label: "Per SCIO report", hint: "By campus/dept.", icon: Building2 },
  { id: "history", label: "Transaction history", hint: "Per item", icon: History },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState("stock-card");
  const active = reportTypes.find((r) => r.id === selected)!;

  return (
    <AppShell title="Generate reports">
      <div className="grid grid-cols-5 gap-3.5">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r.id)}
            className={cn(
              "flex flex-col items-start gap-2.5 rounded-xl border bg-surface p-4 text-left transition-colors",
              selected === r.id ? "border-foreground border-2" : "border-border hover:bg-background",
            )}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-background text-foreground">
              <r.icon size={18} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-bold">{r.label}</span>
              <span className="text-[11px] text-muted-2">{r.hint}</span>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-bold">
            {active.label} preview
            {selected === "stock-card" && (
              <span className="ml-2 font-normal text-muted-2">— Bond Paper A4 (ITM-0041)</span>
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer size={14} strokeWidth={1.8} />
              Print
            </Button>
            <Button variant="dark">
              <Download size={14} strokeWidth={1.8} />
              Export
            </Button>
          </div>
        </div>

        {selected === "stock-card" ? (
          <>
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-background px-4 py-3 text-[12.5px]">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-2">Item code</span>
                <span className="font-semibold">ITM-0041</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-2">Unit</span>
                <span className="font-semibold">Ream</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-2">Reorder level</span>
                <span className="font-semibold">10</span>
              </div>
            </div>

            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Date", "Reference", "Receipt qty", "Issue qty", "Balance"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-border px-3 pb-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-2 first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockCardLedger.map((row, i) => {
                  const last = i === stockCardLedger.length - 1;
                  const cell = `px-3 py-2.5 ${last ? "" : "border-b border-border-soft"}`;
                  return (
                    <tr key={row.date}>
                      <td className={`${cell} pl-0 font-semibold`}>{row.date}</td>
                      <td className={`${cell} text-muted`}>{row.reference}</td>
                      <td className={`${cell} text-muted`}>{row.receiptQty ?? "—"}</td>
                      <td className={`${cell} text-muted`}>{row.issueQty ?? "—"}</td>
                      <td className={`${cell} font-bold`}>{row.balance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-background py-16 text-center">
            <active.icon size={22} strokeWidth={1.6} className="text-muted-2" />
            <span className="text-[13px] font-medium text-muted">
              Select criteria to generate the {active.label.toLowerCase()} report.
            </span>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
