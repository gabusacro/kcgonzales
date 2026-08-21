import { Bell } from "lucide-react";

export function Topbar({
  title,
  userName,
  userRole,
  initials,
}: {
  title: string;
  userName: string;
  userRole: string;
  initials: string;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-7">
      <h1 className="text-base font-bold">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex size-8.5 items-center justify-center rounded-lg border border-border text-[#52525b] transition-colors hover:bg-background"
        >
          <Bell size={17} strokeWidth={1.8} />
        </button>
        <div className="h-6.5 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold">{userName}</span>
            <span className="text-[11px] text-muted-2">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
