import { createClient } from "@/lib/supabase/server";
import { CenterSearch } from "@/components/centers/CenterSearch";
import type { Center } from "@/types/database";

export const revalidate = 60;

export default async function CentersPage() {
  const supabase = await createClient();

  const [{ data: centers }, { data: { user } }] = await Promise.all([
    supabase.from("public_centers").select("id, name, suburb, address, lat, lng, phone, email, website, logo_url, youtube_channel_id, youtube_url, instagram_url, facebook_url, color_hex, bank_name, bsb, account_number, account_name, created_at, events(id, is_live)").order("name"),
    supabase.auth.getUser(),
  ]);

  const centersWithCount = (centers ?? []).map((c) => {
    const events = (c as Record<string, unknown>).events;
    const eventsArr = Array.isArray(events) ? events as { id: string; is_live: boolean }[] : [];
    return {
      ...(c as unknown as Center),
      isLive: eventsArr.some((e) => e.is_live),
    };
  });

  // Fetch initial favourites for the signed-in user (if any)
  let initialFavoriteIds: string[] = [];
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: favs } = await (supabase as any)
      .from("user_favorites")
      .select("center_id")
      .eq("user_id", user.id) as { data: { center_id: string }[] | null };
    initialFavoriteIds = (favs ?? []).map((f) => f.center_id);
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <CenterSearch
        centers={centersWithCount}
        userId={user?.id ?? null}
        initialFavoriteIds={initialFavoriteIds}
      />
    </div>
  );
}
