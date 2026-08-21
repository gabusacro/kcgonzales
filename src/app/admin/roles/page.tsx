"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { roleDefinitions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ManageRolesPage() {
  const [selectedRole, setSelectedRole] = useState(roleDefinitions[0].name);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
    Object.fromEntries(roleDefinitions.map((r) => [r.name, { ...r.permissions }])),
  );

  const active = roleDefinitions.find((r) => r.name === selectedRole)!;
  const activePermissions = permissions[selectedRole];

  function toggle(key: string) {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: { ...prev[selectedRole], [key]: !prev[selectedRole][key] },
    }));
  }

  return (
    <AppShell title="Manage roles">
      <div className="grid grid-cols-[1fr_1.4fr] gap-3.5">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold">Roles</span>
            <button className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground">
              <Plus size={13} strokeWidth={2} />
              New role
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {roleDefinitions.map((r) => (
              <button
                key={r.name}
                onClick={() => setSelectedRole(r.name)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border bg-surface p-3 text-left transition-colors",
                  r.name === selectedRole ? "border-foreground border-2" : "border-border hover:bg-background",
                )}
              >
                <span className="text-[13px] font-bold">{r.name}</span>
                <span className="text-[11.5px] text-muted-2">{r.description}</span>
                <span className="text-[11px] font-medium text-muted">{r.userCount} users</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={`${active.name} — permissions`} />
          <div className="flex flex-col">
            {Object.entries(activePermissions).map(([key, value], i, arr) => (
              <div
                key={key}
                className={`flex items-center justify-between py-2.5 text-[13px] font-medium ${
                  i !== arr.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                {key}
                <Switch checked={value} onChange={() => toggle(key)} />
              </div>
            ))}
          </div>
          <Button variant="dark" className="self-end">
            Save permissions
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "flex h-5.5 w-9.5 shrink-0 items-center rounded-full px-0.5 transition-colors",
        checked ? "justify-end bg-foreground" : "justify-start bg-border",
      )}
    >
      <div className="size-4.5 rounded-full bg-white shadow-sm" />
    </button>
  );
}
