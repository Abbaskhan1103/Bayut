"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart, Navigation } from "lucide-react";
import type { Center } from "@/types/database";

interface Props {
  center: Center;
  distanceKm: number | null;
  isLive?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function CenterCard({
  center,
  distanceKm,
  isLive,
  isFavorited,
  onToggleFavorite,
}: Props) {
  const mapsUrl =
    center.lat && center.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`
      : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[#C9A84C]/30">
      {/* Main tappable area → center detail */}
      <Link
        href={`/centers/${center.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-none overflow-hidden"
          style={{
            backgroundColor: center.logo_url
              ? "transparent"
              : (center.color_hex ?? "#1E2D52") + "33",
          }}
        >
          {center.logo_url ? (
            <Image
              src={center.logo_url}
              alt={center.name}
              width={96}
              height={96}
              sizes="48px"
              className="w-full h-full object-cover"
            />
          ) : (
            "🕌"
          )}
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="font-semibold text-[var(--text)] truncate">{center.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--subtext)]">
            <MapPin className="w-3 h-3 flex-none" />
            <span className="truncate">{center.suburb ?? center.address ?? "Victoria"}</span>
            {distanceKm !== null && (
              <span className="flex-none">
                · {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Right-side actions */}
      <div className="flex items-center gap-2 flex-none">
        {isLive && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {/* Favourite toggle */}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
            aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[var(--subtext)]"
              }`}
            />
          </button>
        )}

        {/* Directions */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-semibold hover:bg-[#C9A84C]/20 transition-colors"
            aria-label="Get directions"
          >
            <Navigation className="w-3 h-3" />
            <span>Directions</span>
          </a>
        )}
      </div>
    </div>
  );
}
