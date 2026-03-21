import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // 20 requests per IP per minute — enough for polling, blocks quota exhaustion attacks
  if (!checkRateLimit(`youtube-live:${getClientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const channelId = req.nextUrl.searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
  }

  // Allow: UC-prefixed IDs (24 chars), @handles, or https://youtube.com URLs
  const isValidChannelInput =
    /^UC[\w-]{22}$/.test(channelId) ||
    /^@[\w.-]{1,100}$/.test(channelId) ||
    /^https?:\/\/(www\.)?youtube\.com\/@?[\w.-]{1,100}(\/.*)?$/.test(channelId);
  if (!isValidChannelInput) {
    return NextResponse.json({ error: "Invalid channelId" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  // Resolve handle/URL to a real channel ID if needed
  let resolvedChannelId = channelId;
  if (channelId.startsWith("http") || channelId.startsWith("@")) {
    const handle = channelId.replace(/^https?:\/\/www\.youtube\.com\/@?/, "").replace(/^@/, "");
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`
    );
    const channelData = await channelRes.json();
    resolvedChannelId = channelData.items?.[0]?.id;
    if (!resolvedChannelId) {
      return NextResponse.json({ live: false, videoId: null, title: null });
    }
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", resolvedChannelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      console.error("[youtube-live] YouTube API error:", JSON.stringify(data));
      return NextResponse.json({ live: false, videoId: null, title: null });
    }

    const item = data.items?.[0];
    if (!item) {
      return NextResponse.json({ live: false, videoId: null, title: null });
    }

    return NextResponse.json({
      live: true,
      videoId: item.id.videoId,
      title: item.snippet.title,
    });
  } catch (err) {
    console.error("[youtube-live] fetch threw:", err);
    return NextResponse.json({ live: false, videoId: null, title: null });
  }
}
