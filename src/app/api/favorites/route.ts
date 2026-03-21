import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { center_id, action } = await req.json();

  if (!center_id || typeof center_id !== "string") {
    return NextResponse.json({ error: "center_id required" }, { status: 400 });
  }
  if (action !== "add" && action !== "remove") {
    return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  if (action === "add") {
    const { error } = await db
      .from("user_favorites")
      .insert({ user_id: user.id, center_id });
    if (error && error.code !== "23505") { // ignore duplicate key
      console.error("[api/favorites add]", error);
      return NextResponse.json({ error: "Failed to add favourite" }, { status: 500 });
    }
  } else {
    const { error } = await db
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("center_id", center_id);
    if (error) {
      console.error("[api/favorites remove]", error);
      return NextResponse.json({ error: "Failed to remove favourite" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
