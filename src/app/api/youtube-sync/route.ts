import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const YT_KEY = process.env.YOUTUBE_API_KEY;
const anthropic = new Anthropic();

interface YTStream {
  videoId: string;
  title: string;
  description: string;
  isLive: boolean;
  scheduledStartTime?: string;
  thumbnailUrl: string;
}

async function fetchChannelStreams(channelId: string): Promise<YTStream[]> {
  const base = "https://www.googleapis.com/youtube/v3";
  const results: YTStream[] = [];

  for (const eventType of ["live", "upcoming"] as const) {
    const searchRes = await fetch(
      `${base}/search?part=snippet&channelId=${channelId}&eventType=${eventType}&type=video&maxResults=5&key=${YT_KEY}`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchData: any = await searchRes.json();
    if (!searchData.items?.length) continue;

    const ids = searchData.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(",");
    if (!ids) continue;

    const videoRes = await fetch(
      `${base}/videos?part=snippet,liveStreamingDetails&id=${ids}&key=${YT_KEY}`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoData: any = await videoRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const video of videoData.items ?? []) {
      const thumbnails = video.snippet?.thumbnails ?? {};
      const thumbnailUrl =
        thumbnails.maxres?.url ??
        thumbnails.standard?.url ??
        thumbnails.high?.url ??
        thumbnails.medium?.url ??
        thumbnails.default?.url ??
        "";

      results.push({
        videoId: video.id,
        title: video.snippet?.title ?? "",
        description: video.snippet?.description ?? "",
        isLive: eventType === "live",
        scheduledStartTime:
          video.liveStreamingDetails?.actualStartTime ??
          video.liveStreamingDetails?.scheduledStartTime,
        thumbnailUrl,
      });
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  if (!YT_KEY) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  // Verify caller is authenticated and manages this center
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 5 syncs per user per hour (very expensive: 1 AI call per YouTube stream found)
  const { checkRateLimit } = await import("@/lib/rate-limit");
  if (!checkRateLimit(`youtube-sync:${user.id}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { center_id } = await req.json();
  if (!center_id) {
    return NextResponse.json({ error: "center_id required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .eq("center_id", center_id)
    .single();

  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: center } = await db
    .from("centers")
    .select("id, name, youtube_channel_id")
    .eq("id", center_id)
    .single();

  if (!center?.youtube_channel_id) {
    return NextResponse.json(
      { error: "No YouTube channel ID set for this centre. Add it in Settings." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: programs } = await db
    .from("events")
    .select("id, title, description, date, time")
    .eq("center_id", center_id)
    .or(`date.gte.${today},date.is.null`)
    .order("date", { ascending: true, nullsFirst: false });

  const programList = programs ?? [];
  const streams = await fetchChannelStreams(center.youtube_channel_id);

  if (!streams.length) {
    return NextResponse.json({ noStreamsFound: true, results: [] });
  }

  const results = [];

  for (const stream of streams) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${stream.videoId}`;

    if (programList.length === 0) {
      results.push({
        videoId: stream.videoId,
        title: stream.title,
        isLive: stream.isLive,
        youtubeUrl,
        thumbnailUrl: stream.thumbnailUrl,
        matched: false,
        programId: null,
        programTitle: null,
        confidence: "low",
        reason: "No upcoming programs in Bayut to match against",
      });
      continue;
    }

    const programsText = programList
      .map(
        (p: { id: string; title: string; date: string | null; time: string | null; description: string | null }, i: number) =>
          `${i + 1}. ID: ${p.id} | Title: ${p.title} | Date: ${p.date ?? "TBA"} | Time: ${p.time ?? "TBA"}${p.description ? ` | Desc: ${p.description.slice(0, 150)}` : ""}`
      )
      .join("\n");

    const textPrompt = `You are matching a YouTube live/scheduled stream to a program in an Islamic centre app called Bayut.

The thumbnail image above is the event poster for this YouTube stream. Read all text visible in the thumbnail — it typically contains the event name, date, time, and other details.

YouTube stream metadata:
- Video title: ${stream.title}
- Currently live: ${stream.isLive}
- Scheduled/Start time: ${stream.scheduledStartTime ?? "unknown"}

Upcoming programs in Bayut for this centre:
${programsText}

Using the thumbnail image as the primary source of truth (it contains the most accurate event details), match this stream to one of the Bayut programs above. Consider event name, date, time, and any other text visible in the thumbnail.

Respond with valid JSON only, no markdown:
{"matched": true or false, "program_id": "the UUID or null", "confidence": "high or medium or low", "reason": "one sentence"}`;

    let matchResult: {
      matched: boolean;
      program_id: string | null;
      confidence: string;
      reason: string;
    } = { matched: false, program_id: null, confidence: "low", reason: "No match" };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageContent: any[] = [];

      // Include thumbnail image if available
      if (stream.thumbnailUrl) {
        messageContent.push({
          type: "image",
          source: { type: "url", url: stream.thumbnailUrl },
        });
      }

      messageContent.push({ type: "text", text: textPrompt });

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: messageContent }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
      matchResult = JSON.parse(raw);
    } catch {
      // keep default no-match
    }

    const validProgramIds = new Set(programList.map((p: { id: string }) => p.id));
    if (matchResult.matched && matchResult.program_id && validProgramIds.has(matchResult.program_id)) {
      await db
        .from("events")
        .update({
          youtube_stream_url: youtubeUrl,
          ...(stream.isLive ? { is_live: true } : {}),
        })
        .eq("id", matchResult.program_id);
    }

    const matchedProgram = programList.find(
      (p: { id: string }) => p.id === matchResult.program_id
    );

    results.push({
      videoId: stream.videoId,
      title: stream.title,
      isLive: stream.isLive,
      youtubeUrl,
      thumbnailUrl: stream.thumbnailUrl,
      matched: matchResult.matched,
      programId: matchResult.program_id,
      programTitle: matchedProgram?.title ?? null,
      confidence: matchResult.confidence,
      reason: matchResult.reason,
    });
  }

  return NextResponse.json({ noStreamsFound: false, results });
}
