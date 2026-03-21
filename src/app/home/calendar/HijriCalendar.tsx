"use client";

import { useState, useMemo } from "react";
import { getHijriDate, getSignificance, SHIA_SIGNIFICANT_DATES } from "@/lib/prayer/hijriDate";
import { cn } from "@/lib/utils";
import Link from "next/link";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SIGNIFICANT_LABELS: Record<string, string> = {
  "1-10": "Ashura",
  "2-20": "Arba'een",
  "3-17": "Wiladat of Prophet",
  "7-27": "Mab'ath",
  "8-15": "Wiladat of Imam Mahdi",
  "9-21": "Shahada of Imam Ali",
  "10-1": "Eid al-Fitr",
  "12-10": "Eid al-Adha",
  "12-18": "Eid al-Ghadir",
};

function getSignificantLabel(month: number, day: number): string | null {
  return SIGNIFICANT_LABELS[`${month}-${day}`] ?? null;
}

export function HijriCalendar({ hijriOffset }: { hijriOffset: number }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const hijriMap = useMemo(() => {
    const map = new Map<number, ReturnType<typeof getHijriDate>>();
    for (const day of days) {
      if (day) map.set(day.getDate(), getHijriDate(day, hijriOffset));
    }
    return map;
  }, [days, hijriOffset]);

  const gregorianMonthLabel = viewDate.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  });

  const midMonthHijri = hijriMap.get(15) ?? hijriMap.get(1);
  const hijriMonthLabel = midMonthHijri
    ? `${midMonthHijri.monthName} ${midMonthHijri.year} AH`
    : "";

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Back */}
      <Link href="/home" className="flex items-center gap-1 text-sm text-[var(--subtext)] -mt-1">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Home
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <p className="font-lora text-lg font-semibold text-[var(--text)]">{gregorianMonthLabel}</p>
          <p className="text-xs text-[#C9A84C] font-medium">{hijriMonthLabel}</p>
        </div>

        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Weekday headers + day cells */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--subtext)] py-1">
            {d}
          </div>
        ))}

        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const hijri = hijriMap.get(day.getDate());
          const significance = hijri ? getSignificance(hijri) : null;
          const todayCell = isToday(day);
          const label = hijri ? getSignificantLabel(hijri.month, hijri.day) : null;

          return (
            <div
              key={day.getDate()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl py-2 gap-0.5 min-h-[52px]",
                todayCell
                  ? "bg-[#C9A84C] text-[#070D1F]"
                  : significance === "shahadat"
                  ? "bg-red-500/10 border border-red-500/20"
                  : significance === "wiladat"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-[var(--surface)] border border-[var(--border)]"
              )}
            >
              <span className={cn(
                "text-sm font-bold leading-none",
                todayCell ? "text-[#070D1F]" : "text-[var(--text)]"
              )}>
                {day.getDate()}
              </span>
              {hijri && (
                <span className={cn(
                  "text-[9px] leading-none font-medium",
                  todayCell
                    ? "text-[#070D1F]/70"
                    : significance === "shahadat"
                    ? "text-red-400"
                    : significance === "wiladat"
                    ? "text-emerald-400"
                    : "text-[var(--subtext)]"
                )}>
                  {hijri.day}
                </span>
              )}
              {label && !todayCell && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current opacity-60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
          <span className="text-xs text-[var(--subtext)]">Shahadat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
          <span className="text-xs text-[var(--subtext)]">Wiladat / Eid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#C9A84C]" />
          <span className="text-xs text-[var(--subtext)]">Today</span>
        </div>
      </div>

      <SignificantDatesThisMonth days={days} hijriMap={hijriMap} />
    </div>
  );
}

function SignificantDatesThisMonth({
  days,
  hijriMap,
}: {
  days: (Date | null)[];
  hijriMap: Map<number, ReturnType<typeof getHijriDate>>;
}) {
  const significant = days
    .filter((d): d is Date => d !== null)
    .flatMap((d) => {
      const hijri = hijriMap.get(d.getDate());
      if (!hijri) return [];
      const key = `${hijri.month}-${hijri.day}`;
      const type = SHIA_SIGNIFICANT_DATES[key];
      if (!type) return [];
      const label = getSignificantLabel(hijri.month, hijri.day);
      return [{ date: d, hijri, type, label }];
    });

  if (significant.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
        Occasions This Month
      </h2>
      <div className="flex flex-col gap-2">
        {significant.map(({ date, hijri, type, label }) => (
          <div
            key={date.getDate()}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 border",
              type === "shahadat"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-emerald-500/10 border-emerald-500/20"
            )}
          >
            <div className={cn(
              "w-1.5 h-8 rounded-full flex-none",
              type === "shahadat" ? "bg-red-400" : "bg-emerald-400"
            )} />
            <div className="flex flex-col min-w-0">
              <p className={cn(
                "text-sm font-semibold",
                type === "shahadat" ? "text-red-400" : "text-emerald-400"
              )}>
                {label ?? (type === "shahadat" ? "Shahadat" : "Wiladat")}
              </p>
              <p className="text-xs text-[var(--subtext)]">
                {date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}{hijri.day} {hijri.monthName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
