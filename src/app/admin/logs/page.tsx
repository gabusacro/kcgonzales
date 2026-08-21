"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge, actionTone } from "@/components/ui/Badge";
import { systemLogs } from "@/lib/mock-data";

const actionTypes = ["All actions", "Login", "Create", "Update", "Delete"];
const users = ["All users", ...Array.from(new Set(systemLogs.map((l) => l.user)))];

export default function SystemLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("All actions");
  const [user, setUser] = useState("All users");

  const filtered = useMemo(
    () =>
      systemLogs.filter((log) => {
        const matchesSearch = log.description.toLowerCase().includes(search.toLowerCase());
        const matchesAction = action === "All actions" || log.action === action;
        const matchesUser = user === "All users" || log.user === user;
        return matchesSearch && matchesAction && matchesUser;
      }),
    [search, action, user],
  );

  return (
    <AppShell title="System logs (audit trail)">
      <Card>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9.5 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search size={15} strokeWidth={1.8} className="text-muted-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
            />
          </div>
          <Dropdown value={action} onChange={setAction} options={actionTypes} />
          <Dropdown value={user} onChange={setUser} options={users} />
          <button className="flex h-9.5 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] font-semibold text-[#3f3f46] hover:bg-background">
            <Download size={14} strokeWidth={1.8} />
            Export
          </button>
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Timestamp", "User", "Action", "Module", "Description"].map((h) => (
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
            {filtered.map((log, i) => {
              const last = i === filtered.length - 1;
              const cell = `px-3 py-2.5 ${last ? "" : "border-b border-border-soft"}`;
              return (
                <tr key={`${log.timestamp}-${log.description}`}>
                  <td className={`${cell} pl-0 text-muted`}>{log.timestamp}</td>
                  <td className={`${cell} font-semibold`}>{log.user}</td>
                  <td className={cell}>
                    <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                  </td>
                  <td className={`${cell} text-muted`}>{log.module}</td>
                  <td className={`${cell} text-muted`}>{log.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-2">Showing {filtered.length} of 1,842 log entries</span>
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

function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9.5 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-[13px] font-medium text-[#3f3f46] outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.8}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-2"
      />
    </div>
  );
}
