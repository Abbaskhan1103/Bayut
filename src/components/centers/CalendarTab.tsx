"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getHijriDate, getSignificance, getSignificanceLabel, type HijriDateResult } from "@/lib/prayer/hijriDate";
import { cn } from "@/lib/utils";
import type { Program, Center, EventCategory } from "@/types/database";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  majlis: "Majlis", lecture: "Lecture", quran: "Quran",
  youth: "Youth", eid: "Eid", community: "Community", other: "Other",
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  majlis: "bg-red-500/10 text-red-500 border-red-500/20",
  lecture: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  quran: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  youth: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  eid: "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20",
  community: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  other: "bg-[var(--border)] text-[var(--subtext)] border-[var(--border)]",
};
import Image from "next/image";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  centerId: string;
  initialPrograms: Program[];
  center: Center;
  hijriOffset?: number;
}

export function CalendarTab({ centerId, initialPrograms, center, hijriOffset = 0 }: Props) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedDayPrograms, setSelectedDayPrograms] = useState<Program[]>([]);
  const [selectedSignificance, setSelectedSignificance] = useState<{
    hijri: HijriDateResult;
    significance: "shahadat" | "wiladat";
    day: Date;
  } | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Realtime subscription for live status + CRUD
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`events:center:${centerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `center_id=eq.${centerId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setPrograms((prev) =>
              prev.map((p) => p.id === (payload.new as Program).id ? (payload.new as Program) : p)
            );
            setSelectedProgram((prev) =>
              prev?.id === (payload.new as Program).id ? (payload.new as Program) : prev
            );
          } else if (payload.eventType === "INSERT") {
            setPrograms((prev) => [...prev, payload.new as Program]);
          } else if (payload.eventType === "DELETE") {
            setPrograms((prev) => prev.filter((p) => p.id !== (payload.old as Program).id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centerId]);

  // Calendar grid cells
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  // Hijri data for all days
  const hijriMap = useMemo(() => {
    const map = new Map<number, ReturnType<typeof getHijriDate>>();
    for (const day of days) {
      if (day) map.set(day.getDate(), getHijriDate(day, hijriOffset));
    }
    return map;
  }, [days, hijriOffset]);

  // Map dateStr (YYYY-MM-DD) → programs
  const programsByDate = useMemo(() => {
    const map = new Map<string, Program[]>();
    for (const p of programs) {
      if (!p.date) continue;
      const list = map.get(p.date) ?? [];
      list.push(p);
      map.set(p.date, list);
    }
    return map;
  }, [programs]);

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

  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function handleDayClick(day: Date) {
    const dayPrograms = programsByDate.get(toDateStr(day)) ?? [];
    const hijri = hijriMap.get(day.getDate());
    const significance = hijri ? getSignificance(hijri) : null;

    if (dayPrograms.length > 0) {
      setSelectedDayPrograms(dayPrograms);
      setSelectedProgram(dayPrograms[0]);
      setSelectedSignificance(null);
      setSheetOpen(true);
    } else if (significance && hijri) {
      setSelectedSignificance({ hijri, significance, day });
      setSelectedProgram(null);
      setSelectedDayPrograms([]);
      setSheetOpen(true);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-2">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <p className="font-lora text-base font-semibold text-[var(--text)]">{gregorianMonthLabel}</p>
            <p className="text-xs text-[#C9A84C] font-medium">{hijriMonthLabel}</p>
          </div>

          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Weekday headers + day cells */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--subtext)] py-1"
            >
              {d}
            </div>
          ))}

          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;

            const hijri = hijriMap.get(day.getDate());
            const significance = hijri ? getSignificance(hijri) : null;
            const todayCell = isToday(day);
            const dayPrograms = programsByDate.get(toDateStr(day)) ?? [];
            const hasProgram = dayPrograms.length > 0;
            const hasLive = dayPrograms.some((p) => p.is_live);

            return (
              <button
                key={day.getDate()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl py-2 gap-0.5 min-h-[52px] transition-all",
                  hasProgram || significance ? "active:scale-95" : "cursor-default",
                  todayCell
                    ? "bg-[#C9A84C]"
                    : significance === "shahadat"
                    ? "bg-red-500/[0.12] border border-red-500/40"
                    : significance === "wiladat"
                    ? "bg-emerald-500/[0.12] border border-emerald-500/40"
                    : "bg-[var(--surface)] border border-[var(--border)]"
                )}
              >
                <span className={cn(
                  "text-sm font-bold leading-none",
                  todayCell
                    ? "text-[#070D1F]"
                    : significance === "shahadat"
                    ? "text-red-500 dark:text-red-400"
                    : significance === "wiladat"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[var(--text)]"
                )}>
                  {day.getDate()}
                </span>
                {hijri && (
                  <span className={cn(
                    "text-[9px] leading-none font-medium",
                    todayCell
                      ? "text-[#070D1F]/70"
                      : significance === "shahadat"
                      ? "text-red-400 dark:text-red-500"
                      : significance === "wiladat"
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-[var(--subtext)]"
                  )}>
                    {hijri.day}
                  </span>
                )}
                {hasProgram && (
                  <span className={cn(
                    "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                    hasLive
                      ? "bg-red-500 animate-pulse"
                      : todayCell
                      ? "bg-black/40"
                      : "bg-[#C9A84C]"
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500/[0.12] border border-red-500/40" />
            <span className="text-xs text-red-500 dark:text-red-400">Shahadat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/[0.12] border border-emerald-500/40" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Wiladat / Eid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
            <span className="text-xs text-[var(--subtext)]">Program</span>
          </div>
        </div>

        {/* Upcoming programs list */}
        <UpcomingPrograms
          programs={programs}
          todayStr={todayStr}
          onSelect={(p) => {
            setSelectedProgram(p);
            setSelectedDayPrograms([]);
            setSelectedSignificance(null);
            setSheetOpen(true);
          }}
        />
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="w-auto max-w-[min(92vw,480px)] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedProgram && (
            <ProgramSheet
              program={selectedProgram}
              center={center}
              allDayPrograms={selectedDayPrograms.length > 1 ? selectedDayPrograms : []}
              onSelectProgram={setSelectedProgram}
            />
          )}
          {!selectedProgram && selectedSignificance && (
            <SignificanceSheet
              hijri={selectedSignificance.hijri}
              significance={selectedSignificance.significance}
              gregorianDate={selectedSignificance.day}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProgramSheet({
  program,
  center,
  allDayPrograms,
  onSelectProgram,
}: {
  program: Program;
  center: Center;
  allDayPrograms: Program[];
  onSelectProgram: (p: Program) => void;
}) {
  const dateStr = program.date
    ? new Date(program.date + "T00:00:00").toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const timeStr = program.time
    ? new Date(`1970-01-01T${program.time}`).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  return (
    <div className="flex flex-col">
      {/* Poster — edge to edge, X button overlays it */}
      {program.poster_image_url && (
        <Image
          src={program.poster_image_url}
          alt={program.title}
          width={480}
          height={480}
          className="w-full h-auto block"
        />
      )}

      <div className="flex flex-col gap-4 p-6">
        {/* Multi-program selector */}
        {allDayPrograms.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allDayPrograms.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProgram(p)}
                className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  p.id === program.id
                    ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                    : "bg-transparent text-[var(--subtext)] border-[var(--border)]"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`self-start px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[program.category as EventCategory] ?? CATEGORY_COLORS.other}`}>
            {CATEGORY_LABELS[program.category as EventCategory] ?? program.category}
          </span>
        </div>

        <DialogHeader>
          <DialogTitle>{program.title}</DialogTitle>
          <p className="text-sm text-[var(--subtext)]">{center.name}</p>
          <p className="text-sm text-[var(--text)]">
            {dateStr}
            {timeStr && ` · ${timeStr}`}
          </p>
        </DialogHeader>

        {program.description && (
          <p className="text-sm text-[var(--subtext)] leading-relaxed">
            {program.description}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {/* YouTube button — live or regular */}
          {program.youtube_stream_url && (
            <a href={program.youtube_stream_url} target="_blank" rel="noopener noreferrer">
              <Button variant={program.is_live ? "live" : "secondary"} className="w-full gap-2">
                {program.is_live ? "🔴 Watch Live on YouTube" : "▶ Watch on YouTube"}
              </Button>
            </a>
          )}

          {/* Booking */}
          <BookingButton program={program} center={center} />
        </div>
      </div>
    </div>
  );
}

function SignificanceSheet({
  hijri,
  significance,
  gregorianDate,
}: {
  hijri: HijriDateResult;
  significance: "shahadat" | "wiladat";
  gregorianDate: Date;
}) {
  const label = getSignificanceLabel(hijri) ?? "Significant Day";
  const isShahadat = significance === "shahadat";

  const dateStr = gregorianDate.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Type badge */}
      <div className={cn(
        "self-start px-3 py-1 rounded-full text-xs font-semibold",
        isShahadat
          ? "bg-red-500/[0.15] text-red-500 dark:text-red-400"
          : "bg-emerald-500/[0.15] text-emerald-600 dark:text-emerald-400"
      )}>
        {isShahadat ? "Shahadat" : "Wiladat / Eid"}
      </div>

      <DialogHeader>
        <DialogTitle>{label}</DialogTitle>
        <p className="text-sm text-[#C9A84C] font-medium">{hijri.formatted}</p>
        <p className="text-sm text-[var(--text)]">{dateStr}</p>
      </DialogHeader>
    </div>
  );
}

function BookingButton({ program, center }: { program: Program; center: Center }) {
  if (program.booking_type === "none") return null;

  if (program.booking_type === "external" && program.booking_url) {
    return (
      <a href={program.booking_url} target="_blank" rel="noopener noreferrer">
        <Button variant="secondary" className="w-full">
          Register / Book Now
        </Button>
      </a>
    );
  }

  if (program.booking_type === "contact") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[var(--subtext)] font-semibold uppercase tracking-wide">
          Contact to register
        </p>
        {center.phone && (
          <a href={`tel:${center.phone}`}>
            <Button variant="secondary" className="w-full">📞 {center.phone}</Button>
          </a>
        )}
        {center.email && (
          <a href={`mailto:${center.email}`}>
            <Button variant="secondary" className="w-full">✉️ {center.email}</Button>
          </a>
        )}
      </div>
    );
  }

  if (program.booking_type === "rsvp") {
    return <RSVPForm programId={program.id} />;
  }

  return null;
}

function UpcomingPrograms({
  programs,
  todayStr,
  onSelect,
}: {
  programs: Program[];
  todayStr: string;
  onSelect: (p: Program) => void;
}) {
  const upcoming = programs
    .filter((p) => !p.date || p.date >= todayStr)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time ?? "").localeCompare(b.time ?? "");
    });

  if (upcoming.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
        Upcoming Programs
      </h3>
      <div className="flex flex-col gap-2">
        {upcoming.map((p) => {
          const dateStr = p.date
            ? new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : "Date TBA";
          const timeStr = p.time
            ? new Date(`1970-01-01T${p.time}`).toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : null;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left active:scale-[0.98] transition-all hover:border-[#C9A84C]/30"
            >
              <div className="flex flex-col items-center justify-center w-10 flex-none">
                {p.date ? (
                  <>
                    <span className="text-[10px] font-semibold uppercase text-[#C9A84C]">
                      {new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-[var(--text)] leading-none">
                      {new Date(p.date + "T00:00:00").getDate()}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--subtext)]">TBA</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{p.title}</p>
                <p className="text-xs text-[var(--subtext)]">
                  {dateStr}{timeStr && ` · ${timeStr}`}
                </p>
              </div>
              {p.is_live && (
                <span className="flex-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RSVPForm({ programId }: { programId: string }) {
  const [form, setForm] = useState({ name: "", email: "", attendees: 1 });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: programId,
        name: form.name,
        email: form.email || null,
        attendees: form.attendees,
      }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-[var(--text)]">RSVP Confirmed!</p>
        <p className="text-sm text-[var(--subtext)]">We&apos;ll see you there.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">RSVP</p>
      <input
        required
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--subtext)] flex-none">Attendees</label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.attendees}
          onChange={(e) => setForm((f) => ({ ...f, attendees: parseInt(e.target.value) || 1 }))}
          className="w-20 h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Confirm RSVP"}
      </Button>
    </form>
  );
}
