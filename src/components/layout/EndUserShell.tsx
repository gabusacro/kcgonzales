import { Search, ClipboardList, LogOut } from "lucide-react";
import { Topbar } from "./Topbar";

const endUserNav = [
  { href: "/request-supplies", label: "Search items", icon: Search },
  { href: "/request-supplies", label: "Request supplies", icon: ClipboardList },
];

export function EndUserShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
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
          END USER
        </div>
        <nav className="flex flex-col gap-0.5">
          {endUserNav.map((item, i) => (
            <div
              key={item.label}
              className={
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium " +
                (i === 1
                  ? "bg-foreground text-white font-semibold"
                  : "text-[#52525b] hover:bg-background")
              }
            >
              <item.icon
                size={18}
                strokeWidth={1.8}
                className={i === 1 ? "" : "text-muted-2"}
              />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="flex-1" />
        <div className="mx-1.5 my-2.5 border-t border-border" />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13.5px] font-medium text-muted hover:bg-background"
          >
            <LogOut size={18} strokeWidth={1.8} className="text-muted-2" />
            Logout
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          userName="Ana Mercado"
          userRole="Faculty"
          initials="AM"
        />
        <main className="flex flex-1 flex-col gap-4 p-6.5">{children}</main>
      </div>
    </div>
  );
}
