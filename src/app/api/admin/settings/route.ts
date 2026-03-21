import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../_guard";

const ALLOWED_KEYS = new Set(["hijri_offset"]);

export async function PATCH(req: NextRequest) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { key, value } = await req.json();

  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "Invalid settings key" }, { status: 400 });
  }

  const { error: dbError } = await db
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (dbError) {
    console.error("[admin/settings PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
