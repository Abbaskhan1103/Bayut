import { Coordinates, CalculationMethod, PrayerTimes, Prayer } from "adhan";

// Melbourne CBD coordinates
const MELBOURNE_COORDS = new Coordinates(-37.8136, 144.9631);

// Tehran calculation method adjusted to match shiaa.com.au
// Fajr: 17.7°, Maghrib: 4.5° (standard Tehran is Fajr 17.7°, Isha 14°)
function getMelbournePrayerParams() {
  const params = CalculationMethod.Tehran();
  // Tehran method already uses Fajr 17.7° and Maghrib 4.5° — matches shiaa.com.au
  return params;
}

export interface PrayerTimesResult {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface NextPrayerResult {
  name: string;
  displayName: string;
  time: Date;
}

const PRAYER_DISPLAY_NAMES: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export function getPrayerTimes(date: Date): PrayerTimesResult {
  const params = getMelbournePrayerParams();
  const times = new PrayerTimes(MELBOURNE_COORDS, date, params);

  return {
    fajr: times.fajr,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function getNextPrayer(now: Date): NextPrayerResult | null {
  const params = getMelbournePrayerParams();
  const times = new PrayerTimes(MELBOURNE_COORDS, now, params);
  const next = times.nextPrayer();

  if (next === Prayer.None) {
    // Past isha — next is tomorrow's fajr
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(MELBOURNE_COORDS, tomorrow, params);
    return {
      name: "fajr",
      displayName: "Fajr",
      time: tomorrowTimes.fajr,
    };
  }

  const nameMap: Record<string, keyof PrayerTimesResult> = {
    [Prayer.Fajr]: "fajr",
    [Prayer.Dhuhr]: "dhuhr",
    [Prayer.Asr]: "asr",
    [Prayer.Maghrib]: "maghrib",
    [Prayer.Isha]: "isha",
  };

  const name = nameMap[next] ?? "fajr";
  return {
    name,
    displayName: PRAYER_DISPLAY_NAMES[name] ?? name,
    time: times[name] as Date,
  };
}

const melbourneTimeFormat = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Australia/Melbourne",
});

export function formatPrayerTime(date: Date): string {
  return melbourneTimeFormat.format(date);
}

export const PRAYER_ORDER: Array<keyof PrayerTimesResult> = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];
