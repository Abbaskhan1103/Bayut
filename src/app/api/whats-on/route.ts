import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 30 searches per user per hour (each call may make up to 3 Anthropic requests)
  const { checkRateLimit } = await import("@/lib/rate-limit");
  if (!checkRateLimit(`whats-on:${user.id}`, 30, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { query, userLat, userLng } = await req.json();
  if (!query || typeof query !== "string") return NextResponse.json({ error: "query required" }, { status: 400 });
  if (query.length > 500) return NextResponse.json({ error: "query too long" }, { status: 400 });

  if (userLat !== undefined && userLat !== null && (typeof userLat !== "number" || userLat < -90 || userLat > 90)) {
    return NextResponse.json({ error: "invalid latitude" }, { status: 400 });
  }
  if (userLng !== undefined && userLng !== null && (typeof userLng !== "number" || userLng < -180 || userLng > 180)) {
    return NextResponse.json({ error: "invalid longitude" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const systemPrompt = `You are a helpful assistant for Bayut, an app for Melbourne's Shia Muslim community. You help users discover upcoming Islamic programs and events at centres near them.

Today is ${now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.
Current time: ${now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })}.
${userLat && userLng ? `User location is available.` : `User location is not available — don't mention distance.`}

Use the search_programs tool to find relevant programs, then reply conversationally and warmly in 1-2 sentences. Don't list the programs yourself — they will be shown as cards below your message. If nothing is found, say so kindly.`;

  const tools: Anthropic.Tool[] = [
    {
      name: "search_programs",
      description: "Search for upcoming Islamic programs and events across all Melbourne Shia centres",
      input_schema: {
        type: "object" as const,
        properties: {
          date_from: {
            type: "string",
            description: "Start date YYYY-MM-DD (inclusive). Use today's date for tonight/today queries.",
          },
          date_to: {
            type: "string",
            description: "End date YYYY-MM-DD (inclusive). For 'tonight' use today. For 'this weekend' use the coming Sunday.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Optional keywords to filter by (e.g. 'Majlis', 'Iftaar', 'Dua', 'Lecture'). Leave empty to return all types.",
          },
        },
        required: ["date_from", "date_to"],
      },
    },
  ];

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: query }];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let programResults: any[] = [];

  // Agentic loop — Claude calls the tool then generates a reply
  for (let i = 0; i < 3; i++) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return NextResponse.json({
        reply: textBlock?.type === "text" ? textBlock.text : "Here's what I found!",
        programs: programResults,
      });
    }

    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") break;

      messages.push({ role: "assistant", content: response.content });

      const input = toolUse.input as {
        date_from: string;
        date_to: string;
        keywords?: string[];
      };

      // Query programs with center info
      const { data: programs } = await db
        .from("events")
        .select("id, title, description, date, time, is_live, center_id, centers(id, name, suburb, lat, lng)")
        .gte("date", input.date_from <= today ? today : input.date_from)
        .lte("date", input.date_to)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(30);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let results: any[] = programs ?? [];

      // Keyword filter
      if (input.keywords?.length) {
        const kws = input.keywords.map((k) => k.toLowerCase());
        results = results.filter((p) =>
          kws.some(
            (kw) =>
              p.title?.toLowerCase().includes(kw) ||
              p.description?.toLowerCase().includes(kw)
          )
        );
      }

      // Add distance + sort by distance if location available
      if (userLat && userLng) {
        results = results
          .map((p) => ({
            ...p,
            distanceKm:
              p.centers?.lat && p.centers?.lng
                ? haversineKm(userLat, userLng, p.centers.lat, p.centers.lng)
                : null,
          }))
          .sort((a, b) => {
            if (a.distanceKm !== null && b.distanceKm !== null)
              return a.distanceKm - b.distanceKm;
            if (a.distanceKm !== null) return -1;
            if (b.distanceKm !== null) return 1;
            return 0;
          });
      }

      programResults = results.slice(0, 8);

      const toolResultText =
        programResults.length === 0
          ? "No programs found for that date range and criteria."
          : programResults
              .map(
                (p) =>
                  `- ${p.title} | ${p.date}${p.time ? " " + p.time : ""} | ${p.centers?.name ?? "Unknown"}, ${p.centers?.suburb ?? ""}${p.distanceKm != null ? ` | ${p.distanceKm < 1 ? Math.round(p.distanceKm * 1000) + "m away" : p.distanceKm.toFixed(1) + "km away"}` : ""}${p.is_live ? " | LIVE NOW" : ""}`
              )
              .join("\n");

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: toolResultText,
          },
        ],
      });
    }
  }

  return NextResponse.json({
    reply: "Sorry, I couldn't complete the search. Please try again.",
    programs: programResults,
  });
}
