import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import type { Center, Program, RSVP } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roleData } = await db
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .single() as { data: { center_id: string } | null };

  if (!roleData?.center_id) redirect("/login");

  const centerId = roleData.center_id;

  const [{ data: center }, { data: programsWithRsvps }] = await Promise.all([
    db.from("centers").select("id, name, suburb, address, lat, lng, phone, email, website, logo_url, youtube_channel_id, youtube_url, instagram_url, facebook_url, color_hex, bank_name, bsb, account_number, account_name, subscription_status, trial_ends_at, created_at").eq("id", centerId).single() as Promise<{ data: Center | null }>,
    db.from("events").select("*, rsvps(*)").eq("center_id", centerId).order("date", { ascending: true }) as Promise<{ data: (Program & { rsvps: RSVP[] })[] | null }>,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const programs = (programsWithRsvps ?? []).map(({ rsvps: _rsvps, ...p }) => p as Program);
  const rsvps = (programsWithRsvps ?? []).flatMap((p) => p.rsvps ?? []);

  return (
    <DashboardClient
      center={center as Center}
      programs={programs}
      rsvps={rsvps}
    />
  );
}
