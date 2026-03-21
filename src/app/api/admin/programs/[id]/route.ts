import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../../_guard";

const ALLOWED_FIELDS = [
  "title", "description", "date", "time",
  "booking_type", "booking_url", "poster_image_url",
  "youtube_stream_url", "category",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const raw = await req.json();

  const safe: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in raw) safe[field] = raw[field];
  }

  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error: dbError } = await db.from("events").update(safe).eq("id", id);
  if (dbError) {
    console.error("[admin/programs PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const { error: dbError } = await db.from("events").delete().eq("id", id);
  if (dbError) {
    console.error("[admin/programs DELETE]", dbError);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
