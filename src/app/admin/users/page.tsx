"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Plus, Pencil, KeyRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge, accountStatusTone, roleTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { systemUsers } from "@/lib/mock-data";
import type { AccountStatus, SystemUser, UserRole } from "@/lib/types";

const roles: (UserRole | "All roles")[] = ["All roles", "Admin", "Supply Officer", "Faculty", "Staff"];
const assignableRoles: UserRole[] = ["Admin", "Supply Officer", "Faculty", "Staff"];

interface UserFormState {
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  status: AccountStatus;
}

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  role: "Faculty",
  department: "",
  status: "Active",
};

function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(systemUsers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("All roles");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [resetNotice, setResetNotice] = useState(false);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = search.toLowerCase();
        const matchesSearch =
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q);
        const matchesRole = role === "All roles" || u.role === role;
        return matchesSearch && matchesRole;
      }),
    [users, search, role],
  );

  function openAdd() {
    setEditingEmail(null);
    setForm(emptyForm);
    setResetNotice(false);
    setModalOpen(true);
  }

  function openEdit(user: SystemUser) {
    setEditingEmail(user.email);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setResetNotice(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function saveUser() {
    if (!form.fullName.trim() || !form.email.trim()) return;
    const record: SystemUser = {
      fullName: form.fullName.trim(),
      initials: initialsOf(form.fullName),
      email: form.email.trim(),
      role: form.role,
      department: form.department.trim() || "—",
      status: form.status,
    };

    if (editingEmail) {
      setUsers((prev) => prev.map((u) => (u.email === editingEmail ? record : u)));
    } else {
      setUsers((prev) => [record, ...prev]);
    }
    setModalOpen(false);
  }

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
              onChange={(e) => setRole(e.target.value as (typeof roles)[number])}
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
          <Button variant="dark" onClick={openAdd}>
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
                    <button
                      onClick={() => openEdit(u)}
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
                <td colSpan={7} className="px-3 py-8 text-center text-muted-2">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingEmail ? `Edit user — ${editingEmail}` : "Add user"}
      >
        <div className="flex flex-col gap-3">
          <Field label="Full name">
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Ana Mercado"
              className="input placeholder:text-muted-2"
            />
          </Field>
          <Field label="Email address">
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@school.edu.ph"
              className="input placeholder:text-muted-2"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assigned role">
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="input"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="SCIO / department">
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="input placeholder:text-muted-2"
              />
            </Field>
          </div>
          <Field label="Account status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AccountStatus }))}
              className="input"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>

          {editingEmail && (
            <div className="flex items-center justify-between rounded-lg border border-border-soft bg-background px-3 py-2.5">
              <span className="text-[12.5px] text-muted">
                {resetNotice ? "Password reset link sent." : "Reset this user's password"}
              </span>
              <button
                onClick={() => setResetNotice(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground"
              >
                <KeyRound size={13} strokeWidth={1.8} />
                Reset password
              </button>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="dark" onClick={saveUser}>
            {editingEmail ? "Save changes" : "Add user"}
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
