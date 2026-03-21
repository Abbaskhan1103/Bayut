"use client";

import { usePrayerTimes } from "./PrayerTimesProvider";
import { formatPrayerTime, PRAYER_ORDER } from "@/lib/prayer/prayerTimes";
import { cn } from "@/lib/utils";

const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const PRAYER_ICONS: Record<string, string> = {
  fajr: "🌙",
  dhuhr: "☀️",
  asr: "🌤️",
  maghrib: "🌅",
  isha: "🌟",
};

export function PrayerStrip() {
  const { times, next } = usePrayerTimes();

  if (!times) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PRAYER_ORDER.map((p) => (
          <div
            key={p}
            className="flex-none w-[76px] h-24 rounded-xl bg-[var(--surface)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
      {PRAYER_ORDER.map((key) => {
        const prayerTime = times[key] as Date;
        const isPast = prayerTime < now;
        const isNext = next?.name === key;

        return (
          <div
            key={key}
            className={cn(
              "flex-none w-[76px] flex flex-col items-center gap-1.5 rounded-2xl border p-3 py-4 snap-start transition-all",
              isNext
                ? "border-[#C9A84C]/50 bg-[#C9A84C]/10 shadow-[0_0_20px_rgba(201,168,76,0.15)]"
                : "border-[var(--border)] bg-[var(--surface)]",
              isPast && !isNext && "opacity-35"
            )}
          >
            <span className="text-xl">{PRAYER_ICONS[key]}</span>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                isNext ? "text-[#C9A84C]" : "text-[var(--subtext)]"
              )}
            >
              {PRAYER_LABELS[key]}
            </span>
            <span
              className={cn(
                "text-xs tabular-nums font-medium",
                isNext ? "text-[var(--text)]" : "text-[var(--subtext)]"
              )}
            >
              {formatPrayerTime(prayerTime)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
