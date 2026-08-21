import { cn } from "@/lib/utils";

type ButtonVariant = "dark" | "outline" | "ghost";

export function Button({
  children,
  variant = "dark",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9.5 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-semibold transition-colors cursor-pointer",
        variant === "dark" &&
          "bg-foreground text-white border border-foreground hover:bg-black",
        variant === "outline" &&
          "bg-surface text-foreground border border-border hover:bg-background",
        variant === "ghost" && "text-muted hover:bg-background",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
