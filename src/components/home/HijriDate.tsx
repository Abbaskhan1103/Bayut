"use client";

import { useEffect, useState } from "react";
import { getHijriDate, getSignificance, getSignificanceLabel } from "@/lib/prayer/hijriDate";
import { cn } from "@/lib/utils";

export function HijriDate({ offset = 0 }: { offset?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] h-32 animate-pulse" />;
  }

  const now = new Date();
  const hijri = getHijriDate(now, offset);
  const significance = getSignificance(hijri);
  const significanceLabel = significance ? getSignificanceLabel(hijri) : null;

  const weekday = now.toLocaleDateString("en-AU", {
    weekday: "long",
    timeZone: "Australia/Melbourne",
  });
  const dateStr = now.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/30 bg-[var(--surface)] p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">
          Today
        </p>

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="font-lora text-2xl font-bold text-[var(--text)]">{weekday}</p>
            <p className="text-sm text-[var(--subtext)]">{dateStr}</p>
          </div>

          {significance && (
            <span className={cn(
              "flex-none mt-0.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
              significance === "shahadat"
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            )}>
              {significance === "shahadat" ? "Shahadat" : "Wiladat"}
            </span>
          )}
        </div>

        <p className={cn(
          "text-sm font-semibold",
          significance === "shahadat"
            ? "text-red-400"
            : significance === "wiladat"
            ? "text-emerald-400"
            : "text-[#C9A84C]"
        )}>
          {hijri.formatted}
        </p>

        {significanceLabel && (
          <p className={cn(
            "text-xs leading-snug",
            significance === "shahadat" ? "text-red-400/70" : "text-emerald-400/70"
          )}>
            {significanceLabel}
          </p>
        )}
      </div>
    </div>
  );
}
