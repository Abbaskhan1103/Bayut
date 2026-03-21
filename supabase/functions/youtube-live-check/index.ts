import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

Deno.serve(async (req) => {
  // Allow internal cron invocations (no Authorization header) but reject
  // external requests that don't supply the shared secret.
  const authHeader = req.headers.get("Authorization");
  const isInternalCron = !authHeader;
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  if (!isInternalCron && !hasValidSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get all centers with a YouTube channel ID
  const { data: centers, error } = await supabase
    .from("centers")
    .select("id, youtube_channel_id")
    .not("youtube_channel_id", "is", null);

  if (error) {
    console.error("Failed to fetch centers:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { center: string; live: boolean; videoId?: string }[] = [];

  for (const center of centers ?? []) {
    if (!center.youtube_channel_id) continue;

    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("channelId", center.youtube_channel_id);
      url.searchParams.set("eventType", "live");
      url.searchParams.set("type", "video");
      url.searchParams.set("key", YOUTUBE_API_KEY);

      const res = await fetch(url.toString());
      const data = await res.json();

      const isLive = Array.isArray(data.items) && data.items.length > 0;
      const videoId = isLive ? data.items[0].id.videoId : null;
      const streamUrl = videoId
        ? `https://www.youtube.com/watch?v=${videoId}`
        : null;

      // Update all events for this center
      await supabase
        .from("events")
        .update({ is_live: isLive, youtube_stream_url: streamUrl })
        .eq("center_id", center.id);

      results.push({ center: center.id, live: isLive, videoId: videoId ?? undefined });
    } catch (err) {
      console.error(`Error checking center ${center.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
