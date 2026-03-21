import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export async function adminGuard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), db: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  return { error: null, db };
}
