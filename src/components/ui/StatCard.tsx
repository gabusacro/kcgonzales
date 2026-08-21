import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  valueClassName?: string;
}) {
  return (
    <Card className="gap-2.5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        {Icon && (
          <div className="flex size-7 items-center justify-center rounded-lg bg-background text-muted">
            <Icon size={15} strokeWidth={1.8} />
          </div>
        )}
      </div>
      <div className={cn("text-[25px] font-extrabold tracking-tight", valueClassName)}>
        {value}
      </div>
      {hint && <span className="text-[11px] text-muted-2">{hint}</span>}
    </Card>
  );
}
