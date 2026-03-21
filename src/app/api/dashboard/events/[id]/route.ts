import { NextRequest, NextResponse } from "next/server";
import { dashboardGuard } from "../../_guard";

const ALLOWED_FIELDS = [
  "title", "description", "date", "time",
  "booking_type", "booking_url", "poster_image_url",
  "youtube_stream_url", "category",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, db, centerId } = await dashboardGuard();
  if (error) return error;

  // Verify event belongs to the manager's center
  const { data: event } = await db.from("events").select("id").eq("id", id).eq("center_id", centerId).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const safe: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) safe[field] = body[field];
  }

  const { error: dbError } = await db.from("events").update(safe).eq("id", id);
  if (dbError) {
    console.error("[dashboard/events PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, db, centerId } = await dashboardGuard();
  if (error) return error;

  // Verify event belongs to the manager's center
  const { data: event } = await db.from("events").select("id").eq("id", id).eq("center_id", centerId).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error: dbError } = await db.from("events").delete().eq("id", id);
  if (dbError) {
    console.error("[dashboard/events DELETE]", dbError);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
