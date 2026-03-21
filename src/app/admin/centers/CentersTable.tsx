"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";

const statusColor: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  trialing: "text-blue-400 bg-blue-400/10",
  past_due: "text-yellow-400 bg-yellow-400/10",
  canceled: "text-red-400 bg-red-400/10",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CentersTable({ centers }: { centers: any[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteCenter(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its events? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/centers/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  if (centers.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <p className="text-[var(--subtext)]">No centers yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Suburb</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Events</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {centers.map((c, i) => (
              <tr key={c.id} className={`${i > 0 ? "border-t border-[var(--border)]" : ""} hover:bg-[var(--border)]/30 transition-colors`}>
                <td className="px-5 py-4 font-medium text-[var(--text)]">{c.name}</td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden sm:table-cell">{c.suburb ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[c.subscription_status] ?? "text-[var(--subtext)] bg-[var(--border)]"}`}>
                    {c.subscription_status}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden sm:table-cell">
                  {Array.isArray(c.events) ? c.events[0]?.count ?? 0 : 0}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/admin/centers/${c.id}/edit`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteCenter(c.id, c.name)}
                      disabled={deleting === c.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
