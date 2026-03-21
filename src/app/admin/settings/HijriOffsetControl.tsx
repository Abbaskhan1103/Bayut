"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HijriOffsetControl({ currentOffset }: { currentOffset: number }) {
  const [offset, setOffset] = useState(currentOffset);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save(value: number) {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "hijri_offset", value: String(value) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  function change(delta: number) {
    const next = Math.max(-2, Math.min(2, offset + delta));
    setOffset(next);
    save(next);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => change(-1)}
        disabled={offset <= -2 || saving}
        className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-lg font-bold text-[var(--text)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--border)] transition-colors"
      >
        −
      </button>

      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-3xl font-bold text-[var(--text)]">
          {offset > 0 ? `+${offset}` : offset}
        </span>
        <span className="text-xs text-[var(--subtext)]">days</span>
      </div>

      <button
        onClick={() => change(+1)}
        disabled={offset >= 2 || saving}
        className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-lg font-bold text-[var(--text)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--border)] transition-colors"
      >
        +
      </button>

      {saved && <span className="text-sm text-emerald-400">Saved</span>}
      {saving && <span className="text-sm text-[var(--subtext)]">Saving…</span>}
    </div>
  );
}
