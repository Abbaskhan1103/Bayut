import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 5 RSVPs per IP per minute
  if (!checkRateLimit(`rsvp:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { event_id, name, email, attendees } = await req.json();

  if (!event_id || typeof event_id !== "string") {
    return NextResponse.json({ error: "event_id required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const count = parseInt(attendees) || 1;
  if (count < 1 || count > 20) {
    return NextResponse.json({ error: "attendees must be between 1 and 20" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  // Verify the event exists
  const { data: event } = await db.from("events").select("id").eq("id", event_id).single();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { error } = await db.from("rsvps").insert({
    event_id,
    name: name.trim().slice(0, 100),
    email: email ? String(email).slice(0, 200) : null,
    attendees: count,
  });

  if (error) {
    console.error("[api/rsvp POST]", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
