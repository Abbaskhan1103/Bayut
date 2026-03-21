import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .single() as { data: { center_id: string } | null };

  if (!roleData?.center_id) {
    return NextResponse.json({ error: "No center found" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase as any)
    .from("centers")
    .select("stripe_customer_id")
    .eq("id", roleData.center_id)
    .single() as { data: { stripe_customer_id: string | null } | null };

  if (!center?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found for this center" },
      { status: 400 }
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: center.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });

  return NextResponse.redirect(session.url, 303);
}
