import { NextRequest, NextResponse } from "next/server";
import { dashboardGuard } from "../_guard";

const ALLOWED_FIELDS = [
  "logo_url", "youtube_url", "instagram_url", "facebook_url",
  "bank_name", "account_name", "bsb", "account_number",
] as const;

const URL_FIELDS = new Set(["youtube_url", "instagram_url", "facebook_url"]);

export async function PATCH(req: NextRequest) {
  const { error, db, centerId } = await dashboardGuard();
  if (error) return error;

  const body = await req.json();

  for (const field of URL_FIELDS) {
    const val = body[field];
    if (val !== undefined && val !== null && val !== "") {
      if (typeof val !== "string" || !/^https?:\/\//i.test(val)) {
        return NextResponse.json({ error: `${field} must be a valid URL` }, { status: 400 });
      }
    }
  }

  const safe: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) safe[field] = body[field];
  }

  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error: dbError } = await db.from("centers").update(safe).eq("id", centerId);
  if (dbError) {
    console.error("[dashboard/centers PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update centre" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
