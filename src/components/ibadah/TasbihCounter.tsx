"use client";

import { useState, useRef, useCallback, useEffect } from "react";

function lsGet(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}
function lsSet(key: string, value: string) {
  localStorage.setItem(key, value);
}

function playBeep(frequency = 880, duration = 150) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // AudioContext not available
  }
}

const PRESETS = [70, 100] as const;

export function TasbihCounter() {
  const [count, setCount] = useState(0);
  const [phrase, setPhrase] = useState("SubhanAllah");
  const [milestone, setMilestone] = useState(70);
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const prevMilestoneHit = useRef(0);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const savedCount = parseInt(lsGet("tasbih_count", "0"), 10);
    const savedPhrase = lsGet("tasbih_phrase", "SubhanAllah");
    const savedMilestone = parseInt(lsGet("tasbih_milestone", "70"), 10);
    const savedIsCustom = lsGet("tasbih_iscustom", "false") === "true";
    const savedCustomValue = lsGet("tasbih_customvalue", "");
    if (savedCount > 0) {
      setCount(savedCount);
      prevMilestoneHit.current = Math.floor(savedCount / savedMilestone);
    }
    setPhrase(savedPhrase);
    setMilestone(savedMilestone > 0 ? savedMilestone : 70);
    setIsCustom(savedIsCustom);
    setCustomValue(savedCustomValue);
  }, []);

  const isAtMilestone = count > 0 && count % milestone === 0;
  const displayPhrase = phrase.trim() || "Tap";

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      const hits = Math.floor(next / milestone);
      const prevHits = Math.floor(prev / milestone);
      if (hits > prevHits) {
        prevMilestoneHit.current = hits;
        playBeep(880 + hits * 110, 200);
      }
      lsSet("tasbih_count", String(next));
      return next;
    });
  }, [milestone]);

  const decrement = () => setCount((c) => {
    const next = Math.max(0, c - 1);
    lsSet("tasbih_count", String(next));
    return next;
  });
  const reset = () => {
    setCount(0);
    prevMilestoneHit.current = 0;
    lsSet("tasbih_count", "0");
  };

  function selectCustom() {
    setIsCustom(true);
    lsSet("tasbih_iscustom", "true");
    const parsed = parseInt(customValue, 10);
    if (parsed > 0) {
      setMilestone(parsed);
      lsSet("tasbih_milestone", String(parsed));
    }
  }

  function handleCustomInput(val: string) {
    setCustomValue(val);
    lsSet("tasbih_customvalue", val);
    const parsed = parseInt(val, 10);
    if (parsed > 0) {
      setMilestone(parsed);
      lsSet("tasbih_milestone", String(parsed));
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Count */}
      <div className="flex flex-col items-center gap-1 pt-4">
        <span className={`font-lora text-8xl font-bold tabular-nums transition-colors leading-none ${isAtMilestone ? "text-[#C9A84C]" : "text-[var(--text)]"}`}>
          {count}
        </span>
        <span className="text-sm text-[var(--subtext)] mt-1">
          Beeps every {milestone} counts
        </span>
        {isAtMilestone && (
          <span className="text-xs text-[#C9A84C] font-semibold animate-pulse">
            {count / milestone}× {milestone}
          </span>
        )}
      </div>

      {/* Big tap button */}
      <button
        onClick={increment}
        className={`w-full rounded-2xl py-8 flex items-center justify-center text-xl font-bold transition-all duration-100 active:scale-[0.97] select-none touch-manipulation ${
          isAtMilestone
            ? "bg-[#E8C96A] text-[#070D1F]"
            : "bg-[var(--surface)] border-2 border-[#C9A84C]/40 text-[var(--text)] hover:border-[#C9A84C]/70"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {displayPhrase}
      </button>

      {/* Reset / -1 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={reset}
          className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors"
        >
          Reset
        </button>
        <button
          onClick={decrement}
          disabled={count === 0}
          className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors disabled:opacity-40"
        >
          −1
        </button>
      </div>

      {/* Phrase input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
          Phrase / Dhikr (English or Arabic)
        </label>
        <input
          value={phrase}
          onChange={(e) => { setPhrase(e.target.value); lsSet("tasbih_phrase", e.target.value); }}
          placeholder="e.g. SubhanAllah, الحمد لله..."
          className="w-full h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        />
      </div>

      {/* Beep every */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
          Beep Every
        </label>
        <div className="flex gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => { setMilestone(m); setIsCustom(false); lsSet("tasbih_milestone", String(m)); lsSet("tasbih_iscustom", "false"); }}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
                !isCustom && milestone === m
                  ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                  : "bg-transparent text-[var(--subtext)] border-[var(--border)] hover:border-[#C9A84C]/50"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            onClick={selectCustom}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
              isCustom
                ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                : "bg-transparent text-[var(--subtext)] border-[var(--border)] hover:border-[#C9A84C]/50"
            }`}
          >
            Custom
          </button>
        </div>
        {isCustom && (
          <input
            type="number"
            min={1}
            placeholder="Enter number..."
            value={customValue}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="w-full h-12 rounded-xl border border-[#C9A84C]/40 bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
          />
        )}
      </div>
    </div>
  );
}
