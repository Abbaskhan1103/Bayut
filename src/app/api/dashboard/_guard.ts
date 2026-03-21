import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function dashboardGuard(requiredCenterId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), db: null, centerId: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: role } = await db
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .single();

  if (!role?.center_id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), db: null, centerId: null };
  }

  // If a specific center is required, verify it matches the user's center
  if (requiredCenterId && role.center_id !== requiredCenterId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), db: null, centerId: null };
  }

  return { error: null, db, centerId: role.center_id as string };
}
