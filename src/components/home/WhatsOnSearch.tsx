"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Search, Loader2, MapPin, Clock, Lock } from "lucide-react";

interface Program {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  is_live: boolean;
  center_id: string;
  distanceKm: number | null;
  centers: {
    name: string;
    suburb: string | null;
  } | null;
}

const SUGGESTIONS = [
  "What's on tonight?",
  "Any Majlis this weekend?",
  "Programs near me tomorrow",
  "Anything on Friday night?",
];

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function WhatsOnSearch({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  async function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setReply(null);
    setPrograms([]);

    try {
      const res = await fetch("/api/whats-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          userLat: userCoords?.lat ?? null,
          userLng: userCoords?.lng ?? null,
        }),
      });
      const data = await res.json();
      setReply(data.reply ?? null);
      setPrograms(data.programs ?? []);

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setReply("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
          What&apos;s On
        </h2>
      </div>

      {/* Sign-in gate */}
      {!isLoggedIn && (
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-3 hover:bg-[#C9A84C]/10 transition-colors"
        >
          <Lock className="w-4 h-4 text-[#C9A84C] flex-none" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-[var(--text)]">Sign in to use AI search</p>
            <p className="text-xs text-[var(--subtext)]">Create a free account to find programs near you</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-[#C9A84C]">Sign in →</span>
        </Link>
      )}

      {/* Search bar */}
      <form onSubmit={handleSubmit} className={`relative flex items-center gap-2 ${!isLoggedIn ? "pointer-events-none opacity-40" : ""}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--subtext)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What's on near me tonight?"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C] transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-11 px-4 rounded-xl bg-[#C9A84C] text-[#070D1F] text-sm font-semibold disabled:opacity-50 transition-opacity flex items-center gap-1.5 flex-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
        </button>
      </form>

      {/* Suggestion chips */}
      {isLoggedIn && !reply && !loading && (
        <div className="flex gap-2 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--subtext)] hover:border-[#C9A84C]/40 hover:text-[var(--text)] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {(reply || loading) && (
        <div ref={resultsRef} className="flex flex-col gap-3">
          {/* Claude's reply */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-4 py-3">
            <Sparkles className="w-4 h-4 text-[#C9A84C] flex-none mt-0.5" />
            {loading ? (
              <p className="text-sm text-[var(--subtext)] italic">Searching programs near you...</p>
            ) : (
              <p className="text-sm text-[var(--text)]">{reply}</p>
            )}
          </div>

          {/* Program cards */}
          {programs.length > 0 && (
            <div className="flex flex-col gap-2">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/centers/${p.center_id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[#C9A84C]/30 active:scale-[0.98] transition-all"
                >
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center w-10 flex-none">
                    {p.date ? (
                      <>
                        <span className="text-[10px] font-semibold uppercase text-[#C9A84C] leading-none">
                          {new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-[var(--text)] leading-tight">
                          {new Date(p.date + "T00:00:00").getDate()}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--subtext)]">TBA</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--subtext)]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-none" />
                        {p.centers?.name ?? "Unknown"}{p.centers?.suburb ? `, ${p.centers.suburb}` : ""}
                      </span>
                      {p.time && (
                        <span className="flex items-center gap-1 flex-none">
                          <Clock className="w-3 h-3" />
                          {formatTime(p.time)}
                        </span>
                      )}
                    </div>
                    {p.date && (
                      <p className="text-[10px] text-[var(--subtext)]">{formatDate(p.date)}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-none">
                    {p.is_live && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {p.distanceKm != null && (
                      <span className="text-[10px] text-[var(--subtext)]">
                        {p.distanceKm < 1
                          ? `${Math.round(p.distanceKm * 1000)}m`
                          : `${p.distanceKm.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* New search */}
          {!loading && (
            <button
              onClick={() => {
                setReply(null);
                setPrograms([]);
                setQuery("");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-xs text-[#C9A84C] hover:underline text-center"
            >
              Search again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
