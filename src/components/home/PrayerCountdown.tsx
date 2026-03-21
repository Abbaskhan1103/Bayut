"use client";

import { usePrayerTimes } from "./PrayerTimesProvider";
import { formatPrayerTime } from "@/lib/prayer/prayerTimes";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function PrayerCountdown() {
  const { next, msUntil, times } = usePrayerTimes();

  if (!times) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 h-36 animate-pulse" />
    );
  }

  if (!next) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/30 bg-[var(--surface)] p-6">
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">
            Next Prayer
          </p>
          <p className="text-xs text-[var(--subtext)]">
            {formatPrayerTime(next.time)}
          </p>
        </div>

        <h2 className="font-lora text-4xl font-bold text-[var(--text)]">
          {next.displayName}
        </h2>

        <div className="flex items-end gap-2">
          <span className="font-mono text-3xl font-semibold text-[#C9A84C] tabular-nums">
            {formatCountdown(msUntil)}
          </span>
          <span className="text-xs text-[var(--subtext)] mb-1">remaining</span>
        </div>
      </div>
    </div>
  );
}
