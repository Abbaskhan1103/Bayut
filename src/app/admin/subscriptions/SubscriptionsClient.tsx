"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
type Status = typeof STATUSES[number];

const statusColor: Record<Status, string> = {
  active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  trialing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  past_due: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  canceled: "text-red-400 bg-red-400/10 border-red-400/20",
};

interface Center {
  id: string;
  name: string;
  suburb: string | null;
  subscription_status: Status;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function SubscriptionsClient({ centers }: { centers: Center[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);

  async function updateStatus(centerId: string, status: Status) {
    setSaving(centerId);
    await fetch(`/api/admin/subscriptions/${centerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_status: status }),
    });
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Center</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Status</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Trial Ends</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden md:table-cell">Stripe</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Change Status</th>
          </tr>
        </thead>
        <tbody>
          {centers.map((c, i) => (
            <tr key={c.id} className={`${i > 0 ? "border-t border-[var(--border)]" : ""}`}>
              <td className="px-5 py-4">
                <p className="font-medium text-[var(--text)]">{c.name}</p>
                <p className="text-xs text-[var(--subtext)]">{c.suburb ?? "—"}</p>
              </td>
              <td className="px-5 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor[c.subscription_status] ?? "text-[var(--subtext)] bg-[var(--border)] border-[var(--border)]"}`}>
                  {c.subscription_status}
                </span>
              </td>
              <td className="px-5 py-4 text-[var(--subtext)] text-xs hidden sm:table-cell">
                {c.trial_ends_at
                  ? new Date(c.trial_ends_at).toLocaleDateString("en-AU")
                  : "—"}
              </td>
              <td className="px-5 py-4 hidden md:table-cell">
                {c.stripe_subscription_id ? (
                  <span className="text-xs text-[var(--subtext)] font-mono">{c.stripe_subscription_id.slice(0, 14)}…</span>
                ) : (
                  <span className="text-xs text-[var(--subtext)]">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                <select
                  value={c.subscription_status}
                  disabled={saving === c.id}
                  onChange={(e) => updateStatus(c.id, e.target.value as Status)}
                  className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
