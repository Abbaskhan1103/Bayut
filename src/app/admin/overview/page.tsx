import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { Building2, CalendarDays, Users, CheckCircle } from "lucide-react";

export default async function AdminOverviewPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const [
    { count: centerCount },
    { count: programCount },
    {},
    { data: centers },
    { data: { users } },
  ] = await Promise.all([
    db.from("centers").select("*", { count: "exact", head: true }),
    db.from("events").select("*", { count: "exact", head: true }),
    db.from("rsvps").select("*", { count: "exact", head: true }),
    db.from("centers").select("subscription_status"),
    db.auth.admin.listUsers(),
  ]);

  const activeCount = (centers ?? []).filter(
    (c: { subscription_status: string }) =>
      c.subscription_status === "active" || c.subscription_status === "trialing"
  ).length;

  const stats = [
    { label: "Centers", value: centerCount ?? 0, icon: Building2, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10" },
    { label: "Programs", value: programCount ?? 0, icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Users", value: users?.length ?? 0, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Active / Trialing", value: activeCount, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Overview</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Platform-wide stats</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
              <p className="text-sm text-[var(--subtext)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent centers */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--subtext)]">Recent Centers</h2>
        <RecentCenters db={db} />
      </div>
    </div>
  );
}

async function RecentCenters({ db }: { db: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data: centers } = await db
    .from("centers")
    .select("id, name, suburb, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const statusColor: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400/10",
    trialing: "text-blue-400 bg-blue-400/10",
    past_due: "text-yellow-400 bg-yellow-400/10",
    canceled: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {(centers ?? []).map((c: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div key={c.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text)] truncate">{c.name}</p>
            <p className="text-xs text-[var(--subtext)]">{c.suburb ?? "—"}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[c.subscription_status] ?? "text-[var(--subtext)] bg-[var(--border)]"}`}>
            {c.subscription_status}
          </span>
        </div>
      ))}
    </div>
  );
}
