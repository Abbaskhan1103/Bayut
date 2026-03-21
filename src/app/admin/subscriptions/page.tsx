import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { SubscriptionsClient } from "./SubscriptionsClient";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: centers } = await db
    .from("centers")
    .select("id, name, suburb, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Subscriptions</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Manage center subscription status</p>
      </div>
      <SubscriptionsClient centers={centers ?? []} />
    </div>
  );
}
