import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../_guard";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ROLES = ["manager", "admin"] as const;

export async function POST(req: NextRequest) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { user_id, center_id, role } = await req.json();

  if (!UUID_RE.test(user_id)) {
    return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
  }
  if (!UUID_RE.test(center_id)) {
    return NextResponse.json({ error: "Invalid center_id" }, { status: 400 });
  }
  const assignedRole = role ?? "manager";
  if (!VALID_ROLES.includes(assignedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { error: dbError } = await db.from("center_roles").upsert(
    { user_id, center_id, role: assignedRole },
    { onConflict: "user_id,center_id" }
  );

  if (dbError) {
    console.error("[admin/roles POST]", dbError);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { role_id } = await req.json();
  if (!UUID_RE.test(role_id)) {
    return NextResponse.json({ error: "Invalid role_id" }, { status: 400 });
  }
  const { error: dbError } = await db.from("center_roles").delete().eq("id", role_id);

  if (dbError) {
    console.error("[admin/roles DELETE]", dbError);
    return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
