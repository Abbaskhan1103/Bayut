import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../../_guard";

// Explicit allowlist prevents mass assignment of sensitive fields
const ALLOWED_FIELDS = [
  "name", "suburb", "address", "lat", "lng",
  "phone", "email", "website", "logo_url",
  "youtube_channel_id", "youtube_url", "instagram_url", "facebook_url",
  "color_hex", "bank_name", "bsb", "account_number", "account_name",
  "stripe_customer_id",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

const URL_FIELDS = new Set(["website", "youtube_url", "instagram_url", "facebook_url"]);
const HEX_RE = /^#[0-9a-fA-F]{3,6}$/;

function pickAllowed(body: Record<string, unknown>): Partial<Record<AllowedField, unknown>> | { validationError: string } {
  for (const field of URL_FIELDS) {
    const val = body[field];
    if (val !== undefined && val !== null && val !== "") {
      if (typeof val !== "string" || !/^https?:\/\//i.test(val)) {
        return { validationError: `${field} must be a valid URL starting with http:// or https://` };
      }
    }
  }
  if (body.color_hex !== undefined && body.color_hex !== null && body.color_hex !== "") {
    if (typeof body.color_hex !== "string" || !HEX_RE.test(body.color_hex)) {
      return { validationError: "color_hex must be a valid hex color (e.g. #1E2D52)" };
    }
  }
  return Object.fromEntries(
    ALLOWED_FIELDS.filter((k) => k in body).map((k) => [k, body[k]])
  ) as Partial<Record<AllowedField, unknown>>;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ centerId: string }> }) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { centerId } = await params;
  const raw = await req.json();
  const body = pickAllowed(raw);

  if ("validationError" in body) {
    return NextResponse.json({ error: body.validationError }, { status: 400 });
  }

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error: dbError } = await db.from("centers").update(body).eq("id", centerId);

  if (dbError) {
    console.error("[admin/centers PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update centre" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ centerId: string }> }) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { centerId } = await params;
  const { error: dbError } = await db.from("centers").delete().eq("id", centerId);

  if (dbError) {
    console.error("[admin/centers DELETE]", dbError);
    return NextResponse.json({ error: "Failed to delete centre" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
