import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { currentUser } from "@/lib/mock-data";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          userName={currentUser.fullName}
          userRole={currentUser.role}
          initials={currentUser.initials}
        />
        <main className="flex flex-1 flex-col gap-4 p-6.5">{children}</main>
      </div>
    </div>
  );
}
