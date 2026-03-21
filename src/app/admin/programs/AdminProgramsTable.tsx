"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminProgramsTable({ programs }: { programs: any[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteProgram(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <p className="text-[var(--subtext)]">No programs yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Centre</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden md:table-cell">Category</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {programs.map((p, i) => (
              <tr key={p.id} className={`${i > 0 ? "border-t border-[var(--border)]" : ""} hover:bg-[var(--border)]/30 transition-colors`}>
                <td className="px-5 py-4 font-medium text-[var(--text)]">{p.title}</td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden sm:table-cell">{p.centers?.name ?? "—"}</td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden sm:table-cell">
                  {p.date ?? "—"}
                  {p.time && <span className="ml-1 text-xs">@ {p.time}</span>}
                </td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden md:table-cell capitalize">{p.category ?? "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => deleteProgram(p.id, p.title)}
                      disabled={deleting === p.id}
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
