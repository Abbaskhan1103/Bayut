"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CenterCard } from "./CenterCard";
import { haversineKm } from "@/lib/geo";
import type { Center } from "@/types/database";

interface Props {
  centers: (Center & { isLive: boolean })[];
  userId: string | null;
  initialFavoriteIds: string[];
}

export function CenterSearch({ centers, userId, initialFavoriteIds }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavoriteIds));

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silent fail
    );
  }, []);

  const handleToggleFavorite = async (centerId: string) => {
    if (!userId) {
      router.push("/login");
      return;
    }

    const isFav = favoriteIds.has(centerId);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(centerId);
      else next.add(centerId);
      return next;
    });

    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ center_id: centerId, action: isFav ? "remove" : "add" }),
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return centers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.suburb ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q)
      )
      .map((c) => ({
        ...c,
        distanceKm:
          userCoords && c.lat && c.lng
            ? haversineKm(userCoords.lat, userCoords.lng, c.lat, c.lng)
            : null,
      }))
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.name.localeCompare(b.name);
      });
  }, [centers, query, userCoords]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtext)]" />
        <Input
          placeholder="Search centers, suburbs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[var(--subtext)] py-12">No centers found</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((center) => (
            <CenterCard
              key={center.id}
              center={center}
              distanceKm={center.distanceKm}
              isLive={center.isLive}
              isFavorited={favoriteIds.has(center.id)}
              onToggleFavorite={() => handleToggleFavorite(center.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
