"use client";

import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, ChevronDown, ChevronUp, Calculator } from "lucide-react";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type Prayer = (typeof PRAYERS)[number];

interface QadhaState {
  current: number;
  initial: number;
}

type QadhaData = Record<Prayer, QadhaState>;

const DEFAULT_STATE: QadhaData = Object.fromEntries(
  PRAYERS.map((p) => [p, { current: 0, initial: 0 }])
) as QadhaData;

const STORAGE_KEY = "bayut_qadha_v1";

function load(): QadhaData {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function save(data: QadhaData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function QadhaCalculator({ onLoad }: { onLoad: (counts: Record<Prayer, number>) => void }) {
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [counts, setCounts] = useState<Record<Prayer, number>>(
    Object.fromEntries(PRAYERS.map((p) => [p, 0])) as Record<Prayer, number>
  );
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const cellInputRef = useRef<HTMLInputElement>(null);

  const totalDays = years * 365 + months * 30;

  // When the time period changes, reset all counts to the new totalDays
  useEffect(() => {
    setCounts(Object.fromEntries(PRAYERS.map((p) => [p, totalDays])) as Record<Prayer, number>);
    setEditingPrayer(null);
  }, [totalDays]);

  useEffect(() => {
    if (editingPrayer) cellInputRef.current?.select();
  }, [editingPrayer]);

  function startCellEdit(prayer: Prayer) {
    setEditDraft(String(counts[prayer]));
    setEditingPrayer(prayer);
  }

  function commitCellEdit(prayer: Prayer) {
    const val = Math.max(0, parseInt(editDraft, 10) || 0);
    setCounts((prev) => ({ ...prev, [prayer]: val }));
    setEditingPrayer(null);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-[#C9A84C]" />
          <div>
            <p className="font-semibold text-[var(--text)] text-sm">Qadha Calculator</p>
            <p className="text-xs text-[var(--subtext)]">Estimate missed prayers by time period</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[var(--subtext)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--subtext)]" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-5 flex flex-col gap-5 border-t border-[var(--border)]">
          {/* Time period steppers */}
          <div className="flex gap-4 pt-4">
            <Stepper label="Years" value={years} onChange={setYears} />
            <Stepper label="Months" value={months} onChange={setMonths} max={11} />
          </div>

          {totalDays > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Summary */}
              <div className="rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 px-4 py-3">
                <p className="text-sm text-[var(--subtext)]">
                  <span className="font-semibold text-[var(--text)]">{totalDays.toLocaleString()} days</span>
                  {" "}· tap any salah below to adjust
                </p>
              </div>

              {/* Per-prayer editable tiles */}
              <div className="grid grid-cols-5 gap-2">
                {PRAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => editingPrayer !== p && startCellEdit(p)}
                    className="flex flex-col items-center gap-1 rounded-xl bg-[var(--background)] border border-[var(--border)] py-2.5 px-1 active:scale-95 transition-all hover:border-[#C9A84C]/40"
                  >
                    <span className="text-[10px] text-[var(--subtext)]">{p}</span>
                    {editingPrayer === p ? (
                      <input
                        ref={cellInputRef}
                        type="number"
                        min="0"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onBlur={() => commitCellEdit(p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitCellEdit(p);
                          if (e.key === "Escape") setEditingPrayer(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-sm font-bold tabular-nums text-center bg-transparent border-b border-[#C9A84C] text-[var(--text)] focus:outline-none"
                      />
                    ) : (
                      <span className={`text-sm font-bold tabular-nums ${counts[p] !== totalDays ? "text-[#C9A84C]" : "text-[var(--text)]"}`}>
                        {counts[p].toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onLoad(counts)}
                className="w-full py-3 rounded-xl bg-[#C9A84C] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Load into Tracker
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--subtext)] text-center py-2">
              Set the years or months above to see your estimate.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      <span className="text-xs font-semibold text-[var(--subtext)] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-lg font-bold text-[var(--text)] disabled:opacity-30 active:scale-90 transition-all"
        >
          −
        </button>
        <span className="flex-1 text-center text-xl font-bold tabular-nums text-[var(--text)]">
          {value}
        </span>
        <button
          onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          disabled={max !== undefined && value >= max}
          className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-lg font-bold text-[#C9A84C] disabled:opacity-30 active:scale-90 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main tracker ─────────────────────────────────────────────────────────────

export function QadhaTracker() {
  const [data, setData] = useState<QadhaData>(DEFAULT_STATE);
  const [editing, setEditing] = useState<Prayer | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(load()); }, []);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function update(prayer: Prayer, updater: (prev: QadhaState) => QadhaState) {
    setData((prev) => {
      const next = { ...prev, [prayer]: updater(prev[prayer]) };
      save(next);
      return next;
    });
  }

  function increment(prayer: Prayer) {
    update(prayer, (s) => ({
      current: s.current + 1,
      initial: Math.max(s.initial, s.current + 1),
    }));
  }

  function decrement(prayer: Prayer) {
    update(prayer, (s) => ({ ...s, current: Math.max(0, s.current - 1) }));
  }

  function reset(prayer: Prayer) {
    update(prayer, () => ({ current: 0, initial: 0 }));
  }

  function startEdit(prayer: Prayer) {
    setDraft(String(data[prayer].current));
    setEditing(prayer);
  }

  function commitEdit(prayer: Prayer) {
    const val = Math.max(0, parseInt(draft, 10) || 0);
    update(prayer, () => ({ current: val, initial: val }));
    setEditing(null);
  }

  function loadFromCalculator(counts: Record<Prayer, number>) {
    PRAYERS.forEach((prayer) => {
      const n = counts[prayer];
      update(prayer, () => ({ current: n, initial: n }));
    });
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Qadha Tracker</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Track your missed prayers</p>
      </div>

      <div className="flex flex-col gap-3">
        {PRAYERS.map((prayer) => {
          const state = data[prayer];
          const completed = state.current === 0 && state.initial > 0;
          const hasValue = state.current > 0 || state.initial > 0;
          const progress = state.initial > 0
            ? ((state.initial - state.current) / state.initial) * 100
            : 0;

          return (
            <div
              key={prayer}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--text)] w-20">{prayer}</span>

                  {completed ? (
                    <Badge variant="success">✓ Completed</Badge>
                  ) : editing === prayer ? (
                    <input
                      ref={inputRef}
                      type="number"
                      min="0"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit(prayer)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(prayer);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="w-16 text-2xl font-bold tabular-nums text-center bg-transparent border-b-2 border-[#C9A84C] text-[var(--text)] focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => hasValue && startEdit(prayer)}
                      className={`text-2xl font-bold tabular-nums text-[var(--text)] ${hasValue ? "underline decoration-dotted underline-offset-4 decoration-[var(--subtext)]" : ""}`}
                    >
                      {state.current}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasValue && (
                    <button
                      onClick={() => reset(prayer)}
                      className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--subtext)] hover:text-red-400 hover:border-red-400/40 active:scale-90 transition-all"
                      aria-label="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => decrement(prayer)}
                    disabled={state.current === 0}
                    className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-xl font-bold text-[var(--text)] disabled:opacity-30 active:scale-90 transition-all"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => increment(prayer)}
                    className="w-12 h-12 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-xl font-bold text-[#C9A84C] active:scale-90 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {state.initial > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Progress value={progress} />
                  <p className="text-xs text-[var(--subtext)] text-right">
                    {state.initial - state.current} of {state.initial} completed
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--subtext)] text-center">
        Tap + to add missed prayers · Tap ✓ to mark one as made up
      </p>

      <QadhaCalculator onLoad={loadFromCalculator} />
    </div>
  );
}
