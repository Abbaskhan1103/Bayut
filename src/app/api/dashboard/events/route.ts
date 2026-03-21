import { NextRequest, NextResponse } from "next/server";
import { dashboardGuard } from "../_guard";

const ALLOWED_FIELDS = [
  "title", "description", "date", "time",
  "booking_type", "booking_url", "poster_image_url",
  "youtube_stream_url", "category",
] as const;

export async function POST(req: NextRequest) {
  const { error, db, centerId } = await dashboardGuard();
  if (error) return error;

  const body = await req.json();
  // rows is an array of event objects (supports recurrence)
  const rows: Record<string, unknown>[] = Array.isArray(body.rows) ? body.rows : [body];

  const safeRows = rows.map((row) => {
    const safe: Record<string, unknown> = { center_id: centerId };
    for (const field of ALLOWED_FIELDS) {
      if (field in row) safe[field] = row[field];
    }
    return safe;
  });

  const { error: dbError } = await db.from("events").insert(safeRows);
  if (dbError) {
    console.error("[dashboard/events POST]", dbError);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
