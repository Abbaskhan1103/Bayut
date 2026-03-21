import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const PROMPT = `Extract event details from the content provided and return ONLY a valid JSON object with exactly these fields:
- "title": string (name of the event)
- "date": string in YYYY-MM-DD format, or null if not found
- "time": string in HH:MM 24-hour format, or null if not found
- "description": string (brief description of the event), or null if not found

Return ONLY the raw JSON object. No markdown, no code fences, no explanation.`;

const MAX_TEXT_LENGTH = 5_000;
const MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB base64

export async function POST(req: NextRequest) {
  // Require an authenticated user to prevent API key abuse
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 20 extractions per user per hour (each call costs Anthropic credits)
  const { checkRateLimit } = await import("@/lib/rate-limit");
  if (!checkRateLimit(`extract-event:${user.id}`, 20, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  const body = await req.json() as {
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
  };

  if (!body.text && !body.imageBase64) {
    return NextResponse.json({ error: "No input provided" }, { status: 400 });
  }

  // Enforce size limits to prevent abuse
  if (body.text && body.text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "Text input too large" }, { status: 400 });
  }

  if (body.imageBase64 && body.imageBase64.length > MAX_IMAGE_BASE64_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  // Validate MIME type allowlist
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (body.imageBase64 && body.imageMimeType && !allowedMimeTypes.includes(body.imageMimeType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const content: Anthropic.MessageParam["content"] =
      body.imageBase64 && body.imageMimeType
        ? [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: body.imageBase64,
              },
            },
            { type: "text", text: PROMPT },
          ]
        : `${PROMPT}\n\nEvent information:\n${body.text}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [{ role: "user", content }],
    });

    const responseText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json(extracted);
  } catch (err) {
    console.error("[extract-event]", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
