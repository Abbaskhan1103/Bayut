"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  getPrayerTimes,
  getNextPrayer,
  type PrayerTimesResult,
  type NextPrayerResult,
} from "@/lib/prayer/prayerTimes";

interface PrayerTimesContextValue {
  times: PrayerTimesResult | null;
  next: NextPrayerResult | null;
  // Milliseconds until next prayer — updates every second
  msUntil: number;
}

const PrayerTimesContext = createContext<PrayerTimesContextValue>({
  times: null,
  next: null,
  msUntil: 0,
});

interface ProviderProps {
  children: React.ReactNode;
  // Server-computed initial values eliminate the first-paint flash
  initialTimes?: PrayerTimesResult;
  initialNext?: NextPrayerResult | null;
}

export function PrayerTimesProvider({ children, initialTimes, initialNext }: ProviderProps) {
  const [times, setTimes] = useState<PrayerTimesResult | null>(initialTimes ?? null);
  const nextRef = useRef<NextPrayerResult | null>(initialNext ?? null);
  const [next, setNext] = useState<NextPrayerResult | null>(initialNext ?? null);
  const [msUntil, setMsUntil] = useState(() =>
    initialNext ? initialNext.time.getTime() - Date.now() : 0
  );

  useEffect(() => {
    // Re-compute on client to correct for any server/client clock skew
    const now = new Date();
    const t = getPrayerTimes(now);
    const n = getNextPrayer(now);
    setTimes(t);
    nextRef.current = n;
    setNext(n);
    setMsUntil(n ? n.time.getTime() - Date.now() : 0);

    const tick = setInterval(() => {
      const remaining = nextRef.current
        ? nextRef.current.time.getTime() - Date.now()
        : 0;
      if (remaining <= 0) {
        // Recompute next prayer and refresh times (handles day rollover too)
        const newNow = new Date();
        const newNext = getNextPrayer(newNow);
        nextRef.current = newNext;
        setNext(newNext);
        setTimes(getPrayerTimes(newNow));
        setMsUntil(newNext ? newNext.time.getTime() - Date.now() : 0);
      } else {
        setMsUntil(remaining);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  return (
    <PrayerTimesContext.Provider value={{ times, next, msUntil }}>
      {children}
    </PrayerTimesContext.Provider>
  );
}

export function usePrayerTimes() {
  return useContext(PrayerTimesContext);
}
