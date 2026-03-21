import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#C9A84C] text-[#070D1F]",
    secondary: "bg-[var(--surface)] text-[var(--subtext)] border border-[var(--border)]",
    destructive: "bg-red-600/20 text-red-400 border border-red-600/30",
    outline: "border border-[var(--border)] text-[var(--text)]",
    success: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
