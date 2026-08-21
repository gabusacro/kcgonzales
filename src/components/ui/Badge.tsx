import { cn } from "@/lib/utils";

export type BadgeTone =
  | "critical"
  | "low"
  | "ok"
  | "neutral"
  | "neutral-dark";

const toneClasses: Record<BadgeTone, string> = {
  critical: "bg-critical-bg text-critical-text border-critical-border",
  low: "bg-low-bg text-low-text border-low-border",
  ok: "bg-ok-bg text-ok-text border-ok-border",
  neutral: "bg-background text-muted border-border",
  "neutral-dark": "bg-foreground text-white border-foreground",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function stockStatusTone(status: "OK" | "Low" | "Critical"): BadgeTone {
  if (status === "Critical") return "critical";
  if (status === "Low") return "low";
  return "ok";
}

export function requestStatusTone(
  status: "Pending" | "Approved" | "Rejected" | "Released",
): BadgeTone {
  if (status === "Pending") return "low";
  if (status === "Approved" || status === "Released") return "ok";
  return "critical";
}

export function accountStatusTone(status: "Active" | "Inactive"): BadgeTone {
  return status === "Active" ? "ok" : "critical";
}

export function roleTone(
  role: "Admin" | "Supply Officer" | "Faculty" | "Staff",
): BadgeTone {
  if (role === "Admin") return "neutral-dark";
  return "neutral";
}

export function actionTone(
  action: "Create" | "Login" | "Update" | "Delete",
): BadgeTone {
  if (action === "Delete") return "critical";
  if (action === "Update") return "low";
  if (action === "Create") return "ok";
  return "neutral";
}
