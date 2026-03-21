"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { EventCategory } from "@/types/database";

type Program = {
  id: string;
  center_id: string;
  title: string;
  date: string | null;
  time: string | null;
  is_live: boolean;
  category: EventCategory;
  centers: { id: string; name: string; suburb: string | null } | null;
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  majlis: "Majlis",
  lecture: "Lecture",
  quran: "Quran",
  youth: "Youth",
  eid: "Eid",
  community: "Community",
  other: "Other",
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

const ALL_CATEGORIES: EventCategory[] = ["majlis", "lecture", "quran", "youth", "eid", "community", "other"];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true });
}

interface Props {
  programs: Program[];
}

export function ProgramsFeed({ programs }: Props) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);

  // Get only categories that have at least one program
  const presentCategories = ALL_CATEGORIES.filter((cat) =>
    programs.some((p) => p.category === cat)
  );

  const filtered = activeCategory
    ? programs.filter((p) => p.category === activeCategory)
    : programs;

  // Group by date
  const grouped: Record<string, Program[]> = {};
  for (const program of filtered) {
    const key = program.date ?? "Unknown date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(program);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Category filter pills */}
      {presentCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === null
                ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                : "bg-transparent text-[var(--subtext)] border-[var(--border)]"
            }`}
          >
            All
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                  : "bg-transparent text-[var(--subtext)] border-[var(--border)]"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-center text-[var(--subtext)] py-12">No programs in this category.</p>
      ) : (
        Object.entries(grouped).map(([date, dayPrograms]) => (
          <section key={date} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">
              {formatDate(date)}
            </h2>

            {dayPrograms.map((program) => {
              const center = program.centers;
              return (
                <Link
                  key={program.id}
                  href={`/centers/${program.center_id}`}
                  className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 active:scale-[0.98] transition-all hover:border-[#C9A84C]/30"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-none bg-[var(--border)]">
                    🕌
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text)] truncate">{program.title}</p>

                    <div className="flex items-center gap-3 text-xs text-[var(--subtext)]">
                      {program.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(program.time)}
                        </span>
                      )}
                      {center && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-none" />
                          <span className="truncate">{center.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`self-start px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[program.category]}`}>
                        {CATEGORY_LABELS[program.category]}
                      </span>
                      {program.is_live && (
                        <span className="self-start flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE NOW
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
