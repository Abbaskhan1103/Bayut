import { getHijriOffset } from "@/lib/settings";
import { HijriCalendar } from "./HijriCalendar";

export default async function HijriCalendarPage() {
  const hijriOffset = await getHijriOffset();
  return <HijriCalendar hijriOffset={hijriOffset} />;
}
