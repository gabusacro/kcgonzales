"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Plus, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge, accountStatusTone, roleTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { systemUsers } from "@/lib/mock-data";

const roles = ["All roles", "Admin", "Supply Officer", "Faculty", "Staff"];

export default function ManageUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All roles");

  const filtered = useMemo(
    () =>
      systemUsers.filter((u) => {
        const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase());
        const matchesRole = role === "All roles" || u.role === role;
        return matchesSearch && matchesRole;
      }),
    [search, role],
  );

  return (
    <AppShell title="Manage users">
      <Card>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9.5 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search size={15} strokeWidth={1.8} className="text-muted-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
            />
          </div>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9.5 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-[13px] font-medium text-[#3f3f46] outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
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
            Add user
          </Button>
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["", "Full name", "Email", "Role", "SCIO / dept.", "Status"].map((h) => (
                <th
                  key={h}
                  className="border-b border-border px-3 pb-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-2 first:pl-0"
                >
                  {h}
                </th>
              ))}
              <th className="border-b border-border px-3 pb-2 text-right text-[11px] font-bold uppercase tracking-wider text-muted-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const last = i === filtered.length - 1;
              const cell = `px-3 py-2.5 ${last ? "" : "border-b border-border-soft"}`;
              return (
                <tr key={u.email}>
                  <td className={`${cell} pl-0`}>
                    <div className="flex size-7 items-center justify-center rounded-full bg-background text-[11px] font-bold">
                      {u.initials}
                    </div>
                  </td>
                  <td className={`${cell} font-semibold`}>{u.fullName}</td>
                  <td className={`${cell} text-muted`}>{u.email}</td>
                  <td className={cell}>
                    <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                  </td>
                  <td className={`${cell} text-muted`}>{u.department}</td>
                  <td className={cell}>
                    <Badge tone={accountStatusTone(u.status)}>{u.status}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <button className="inline-flex size-7 items-center justify-center rounded-md border border-border text-[#52525b] hover:bg-background">
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
