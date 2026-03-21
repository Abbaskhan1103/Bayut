"use client";

import { useState } from "react";
import { Youtube, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SyncResult {
  videoId: string;
  title: string;
  isLive: boolean;
  youtubeUrl: string;
  thumbnailUrl: string;
  matched: boolean;
  programId: string | null;
  programTitle: string | null;
  confidence: string;
  reason: string;
}

export function YouTubeSyncButton({
  centerId,
  onSynced,
}: {
  centerId: string;
  onSynced: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noStreams, setNoStreams] = useState(false);

  async function handleSync() {
    setLoading(true);
    setResults(null);
    setError(null);
    setNoStreams(false);

    try {
      const res = await fetch("/api/youtube-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ center_id: centerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (data.noStreamsFound) {
        setNoStreams(true);
        return;
      }

      setResults(data.results);
      if (data.results.some((r: SyncResult) => r.matched)) {
        onSynced();
      }
    } catch {
      setError("Failed to reach sync endpoint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="sm"
        variant="secondary"
        onClick={handleSync}
        disabled={loading}
        className="gap-2 w-fit"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Youtube className="w-4 h-4 text-red-500" />
        )}
        {loading ? "Checking YouTube..." : "Sync YouTube Live"}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-none mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {noStreams && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
          <Youtube className="w-4 h-4 text-[var(--subtext)] flex-none" />
          <p className="text-xs text-[var(--subtext)]">No live or scheduled streams found on your YouTube channel.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <div
              key={r.videoId}
              className={`rounded-xl border overflow-hidden ${
                r.matched
                  ? "border-emerald-500/30"
                  : "border-[var(--border)]"
              }`}
            >
              {/* Thumbnail */}
              {r.thumbnailUrl && (
                <div className="relative w-full aspect-video">
                  <Image
                    src={r.thumbnailUrl}
                    alt={r.title}
                    fill
                    className="object-cover"
                  />
                  {r.isLive && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
              )}

              {/* Result info */}
              <div className={`flex flex-col gap-1.5 px-3 py-2.5 ${r.matched ? "bg-emerald-500/10" : "bg-[var(--surface)]"}`}>
                <div className="flex items-center gap-2">
                  {r.matched ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-none" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[var(--subtext)] flex-none" />
                  )}
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{r.title}</p>
                </div>
                {r.matched ? (
                  <p className="text-xs text-emerald-400 pl-6">
                    Linked to <span className="font-semibold">{r.programTitle}</span>
                    {r.isLive && " · marked live"}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--subtext)] pl-6">{r.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
