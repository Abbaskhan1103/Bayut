import { HijriDate } from "@/components/home/HijriDate";
import { PrayerCountdown } from "@/components/home/PrayerCountdown";
import { PrayerStrip } from "@/components/home/PrayerStrip";
import { DashboardTiles } from "@/components/home/DashboardTiles";
import { WhatsOnSearch } from "@/components/home/WhatsOnSearch";
import { PrayerTimesProvider } from "@/components/home/PrayerTimesProvider";
import { getHijriOffset } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const hijriOffset = await getHijriOffset();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Welcome message for signed-in users */}
      {user && displayName && (
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">Welcome back</p>
          <p className="text-xl font-bold text-[var(--text)]">{displayName}</p>
        </div>
      )}

      {/* Date tile */}
      <HijriDate offset={hijriOffset} />

      {/* Single provider computes prayer times once for both children */}
      <PrayerTimesProvider>
        {/* Next prayer countdown hero */}
        <PrayerCountdown />

        {/* 5-prayer strip */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)] mb-3">
            Today&apos;s Prayers
          </h2>
          <PrayerStrip />
        </section>
      </PrayerTimesProvider>

      {/* Quick navigation tiles */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)] mb-3">
          Quick Access
        </h2>
        <DashboardTiles />
      </section>

      {/* AI what's on search */}
      <WhatsOnSearch isLoggedIn={!!user} />
    </div>
  );
}
