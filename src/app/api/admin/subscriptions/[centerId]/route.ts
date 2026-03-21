import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "../../_guard";

const VALID_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
type SubscriptionStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ centerId: string }> }) {
  const { error, db } = await adminGuard();
  if (error) return error;

  const { centerId } = await params;
  const { subscription_status } = await req.json();

  if (!VALID_STATUSES.includes(subscription_status as SubscriptionStatus)) {
    return NextResponse.json({ error: "Invalid subscription_status" }, { status: 400 });
  }

  const { error: dbError } = await db
    .from("centers")
    .update({ subscription_status })
    .eq("id", centerId);

  if (dbError) {
    console.error("[admin/subscriptions PATCH]", dbError);
    return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
