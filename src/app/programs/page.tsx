import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { CreateProgramButton } from "@/components/programs/CreateProgramButton";
import { ProgramsFeed } from "@/components/programs/ProgramsFeed";

export const revalidate = 60;


export default async function ProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 px-6 text-center">
        <CalendarDays className="w-14 h-14 text-[#C9A84C]" strokeWidth={1.4} />
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Your Programs Feed</h2>
          <p className="text-sm text-[var(--subtext)]">
            Sign in and favourite your local Islamic centres to see their upcoming programs here.
          </p>
        </div>
        <Link
          href="/login"
          className="px-6 py-3 rounded-2xl bg-[#C9A84C] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Check if user is a centre manager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .single() as { data: { center_id: string } | null };

  const managerCenterId = roleData?.center_id ?? null;

  // Get the user's favourited center IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: favs } = await (supabase as any)
    .from("user_favorites")
    .select("center_id")
    .eq("user_id", user.id) as { data: { center_id: string }[] | null };

  const favCenterIds = (favs ?? []).map((f) => f.center_id);

  if (favCenterIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 px-6 text-center">
        <CalendarDays className="w-14 h-14 text-[#C9A84C]" strokeWidth={1.4} />
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">No favourites yet</h2>
          <p className="text-sm text-[var(--subtext)]">
            Head to the Centres tab and tap the heart icon on your local centres to follow their programs.
          </p>
        </div>
        <Link
          href="/centers"
          className="px-6 py-3 rounded-2xl bg-[#C9A84C] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Browse Centres
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch upcoming programs from favourited centers, joining center name & logo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: programs, error: programsError } = await (supabase as any)
    .from("events")
    .select("id, center_id, title, date, time, is_live, category, centers(id, name, suburb)")
    .in("center_id", favCenterIds)
    .gte("date", today)
    .order("date", { ascending: true, nullsFirst: false })
    .order("time", { ascending: true }) as {
      data: Array<{
        id: string;
        center_id: string;
        title: string;
        date: string | null;
        time: string | null;
        is_live: boolean;
        category: string;
        centers: { id: string; name: string; suburb: string | null } | null;
      }> | null;
      error: unknown;
    };

  if (programsError) console.error("Programs query error:", programsError);
  const upcomingPrograms = programs ?? [];

  if (upcomingPrograms.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--text)]">Programs</h1>
          {managerCenterId && <CreateProgramButton centerId={managerCenterId} />}
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <CalendarDays className="w-12 h-12 text-[var(--subtext)]" strokeWidth={1.4} />
          <p className="text-sm text-[var(--subtext)]">No upcoming programs from your favourite centres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--text)]">Programs</h1>
        {managerCenterId && <CreateProgramButton centerId={managerCenterId} />}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProgramsFeed programs={upcomingPrograms as any} />
    </div>
  );
}
