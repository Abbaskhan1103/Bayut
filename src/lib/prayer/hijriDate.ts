export interface HijriDateResult {
  day: number;
  month: number;
  monthName: string;
  year: number;
  formatted: string; // e.g. "15 Sha'ban 1447"
}

const HIJRI_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

// Shia significant dates: { "month-day": type }
export const SHIA_SIGNIFICANT_DATES: Record<string, "shahadat" | "wiladat"> = {
  // Muharram
  "1-1": "wiladat",
  "1-10": "shahadat", // Ashura
  // Safar
  "2-20": "wiladat",  // Arba'een
  "2-28": "shahadat", // Shahada of Prophet
  "2-29": "shahadat", // Shahada of Imam Ali al-Hadi
  // Rabi' al-Awwal
  "3-8": "shahadat",  // Shahada of Imam Hasan al-Askari
  "3-17": "wiladat",  // Wiladat of Prophet & Imam Sadiq
  // Jamada al-Thani
  "6-3": "shahadat",  // Shahada of Bibi Fatima (older narration)
  "6-13": "wiladat",  // Wiladat of Imam Ali
  // Rajab
  "7-1": "wiladat",   // First of Rajab
  "7-3": "shahadat",  // Shahada of Imam Ali al-Hadi
  "7-13": "wiladat",  // Wiladat of Imam Ali
  "7-27": "wiladat",  // Mab'ath
  // Sha'ban
  "8-3": "wiladat",   // Wiladat of Imam Husayn
  "8-4": "wiladat",   // Wiladat of Abbas ibn Ali
  "8-5": "wiladat",   // Wiladat of Imam Zain al-Abidin
  "8-15": "wiladat",  // Wiladat of Imam Mahdi
  // Ramadan
  "9-19": "shahadat", // Shahada of Imam Ali (wounded)
  "9-21": "shahadat", // Shahada of Imam Ali
  // Shawwal
  "10-1": "wiladat",  // Eid al-Fitr
  "10-25": "shahadat",// Shahada of Imam Sadiq
  // Dhu al-Qi'dah
  "11-11": "wiladat", // Wiladat of Imam Ali al-Rida
  // Dhu al-Hijjah
  "12-10": "wiladat", // Eid al-Adha
  "12-18": "wiladat", // Eid al-Ghadir
};

export function getHijriDate(date: Date = new Date(), offset = 0): HijriDateResult {
  // Apply offset in days — lets admin correct for moon sighting differences
  const shifted = offset !== 0
    ? new Date(date.getTime() + offset * 24 * 60 * 60 * 1000)
    : date;

  const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  });

  const parts = formatter.formatToParts(shifted);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const day = parseInt(partMap.day ?? "1", 10);
  const month = parseInt(partMap.month ?? "1", 10);
  const year = parseInt(partMap.year ?? "1447", 10);
  const monthName = HIJRI_MONTH_NAMES[month - 1] ?? "Unknown";

  return {
    day,
    month,
    year,
    monthName,
    formatted: `${day} ${monthName} ${year}`,
  };
}

export const SHIA_SIGNIFICANT_DATE_LABELS: Record<string, string> = {
  "1-1":  "Islamic New Year",
  "1-10": "Ashura — Martyrdom of Imam Husayn (AS)",
  "2-20": "Arba'een",
  "2-28": "Martyrdom of Prophet Muhammad (PBUH)",
  "2-29": "Martyrdom of Imam Ali al-Hadi (AS)",
  "3-8":  "Martyrdom of Imam Hasan al-Askari (AS)",
  "3-17": "Birth of Prophet Muhammad (PBUH) & Imam Ja'far al-Sadiq (AS)",
  "6-3":  "Martyrdom of Sayyida Fatima al-Zahra (AS)",
  "6-13": "Birth of Imam Ali ibn Abi Talib (AS)",
  "7-1":  "First of Rajab",
  "7-3":  "Martyrdom of Imam Ali al-Hadi (AS)",
  "7-13": "Birth of Imam Ali ibn Abi Talib (AS)",
  "7-27": "Mab'ath — Commencement of the Prophet's Mission",
  "8-3":  "Birth of Imam Husayn ibn Ali (AS)",
  "8-4":  "Birth of Abbas ibn Ali (AS)",
  "8-5":  "Birth of Imam Zain al-Abidin (AS)",
  "8-15": "Birth of Imam al-Mahdi (AJ)",
  "9-19": "Imam Ali (AS) Struck by Sword",
  "9-21": "Martyrdom of Imam Ali ibn Abi Talib (AS)",
  "10-1": "Eid al-Fitr",
  "10-25":"Martyrdom of Imam Ja'far al-Sadiq (AS)",
  "11-11":"Birth of Imam Ali al-Rida (AS)",
  "12-10":"Eid al-Adha",
  "12-18":"Eid al-Ghadir",
};

export function getSignificance(hijriDate: HijriDateResult): "shahadat" | "wiladat" | null {
  return SHIA_SIGNIFICANT_DATES[`${hijriDate.month}-${hijriDate.day}`] ?? null;
}

export function getSignificanceLabel(hijriDate: HijriDateResult): string | null {
  return SHIA_SIGNIFICANT_DATE_LABELS[`${hijriDate.month}-${hijriDate.day}`] ?? null;
}
