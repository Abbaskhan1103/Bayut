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

export function PrayerTimesProvider({ children }: { children: React.ReactNode }) {
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const nextRef = useRef<NextPrayerResult | null>(null);
  const [next, setNext] = useState<NextPrayerResult | null>(null);
  const [msUntil, setMsUntil] = useState(0);

  useEffect(() => {
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
