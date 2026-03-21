import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../_guard";

const ALLOWED_FIELDS = [
  "title", "description", "date", "time",
  "booking_type", "booking_url", "poster_image_url",
  "youtube_stream_url", "category",
] as const;

export async function POST(req: NextRequest) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const { center_id, rows: rawRows } = body;

  if (!center_id) {
    return NextResponse.json({ error: "center_id is required" }, { status: 400 });
  }

  const rows: Record<string, unknown>[] = Array.isArray(rawRows) ? rawRows : [body];

  const safeRows = rows.map((row) => {
    const safe: Record<string, unknown> = { center_id };
    for (const field of ALLOWED_FIELDS) {
      if (field in row) safe[field] = row[field];
    }
    return safe;
  });

  const { error: dbError } = await db.from("events").insert(safeRows);
  if (dbError) {
    console.error("[admin/programs POST]", dbError);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
