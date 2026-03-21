import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .from("center_roles")
    .select("center_id")
    .eq("user_id", user.id)
    .single() as { data: { center_id: string } | null };

  if (!roleData?.center_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--subtext)]">No center assigned to your account.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase as any)
    .from("centers")
    .select("subscription_status, name")
    .eq("id", roleData.center_id)
    .single() as { data: { subscription_status: string; name: string } | null };

  if (center?.subscription_status === "past_due" || center?.subscription_status === "canceled") {
    return <PaywallScreen centerName={center.name ?? "Your Center"} />;
  }

  return <>{children}</>;
}
