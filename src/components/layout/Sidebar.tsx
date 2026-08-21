"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Truck,
  FileText,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  ScrollText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/releases", label: "Releases (RIS)", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNav = [
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
  { href: "/admin/logs", label: "System Logs", icon: ScrollText },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-foreground text-white font-semibold"
          : "text-[#52525b] hover:bg-background",
      )}
    >
      <Icon size={18} strokeWidth={1.8} className={active ? "" : "text-muted-2"} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-62 shrink-0 flex-col border-r border-border bg-surface p-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-5.5 pt-1.5">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
          <span className="text-sm font-extrabold text-white">U</span>
          <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-[3px] border-2 border-surface bg-gold" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14.5px] font-extrabold">USTP</span>
          <span className="text-[10.5px] font-medium text-muted-2">
            Supply &amp; Property
          </span>
        </div>
      </div>

      <div className="px-2.5 pb-1.5 text-[10.5px] font-bold tracking-wider text-muted-2">
        MAIN
      </div>
      <nav className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-bold tracking-wider text-muted-2">
        ADMIN
      </div>
      <nav className="flex flex-col gap-0.5">
        {adminNav.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="flex-1" />

      <div className="mx-1.5 my-2.5 border-t border-border" />
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium text-muted hover:bg-background"
      >
        <LogOut size={18} strokeWidth={1.8} className="text-muted-2" />
        Logout
      </Link>
    </aside>
  );
}
