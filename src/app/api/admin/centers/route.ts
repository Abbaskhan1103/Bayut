import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../_guard";

// Explicit allowlist prevents mass assignment of sensitive fields
// (stripe_customer_id, stripe_subscription_id, subscription_status, etc.)
const ALLOWED_FIELDS = [
  "name", "suburb", "address", "lat", "lng",
  "phone", "email", "website", "logo_url",
  "youtube_channel_id", "youtube_url", "instagram_url", "facebook_url",
  "color_hex", "bank_name", "bsb", "account_number", "account_name",
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

export async function GET() {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { data, error: dbError } = await db
    .from("centers")
    .select("id, name")
    .order("name", { ascending: true });

  if (dbError) {
    console.error("[admin/centers GET]", dbError);
    return NextResponse.json({ error: "Failed to fetch centres" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const raw = await req.json();
  const body = pickAllowed(raw);

  if ("validationError" in body) {
    return NextResponse.json({ error: body.validationError }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error: dbError } = await db.from("centers").insert(body).select().single();

  if (dbError) {
    console.error("[admin/centers POST]", dbError);
    return NextResponse.json({ error: "Failed to create centre" }, { status: 500 });
  }
  return NextResponse.json(data);
}
