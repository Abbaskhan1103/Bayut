"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Center { id: string; name: string }
interface Role { id: string; center_id: string; center_name: string; role: string }
interface User { id: string; email?: string; created_at: string; role: Role | null }

interface Props {
  users: User[];
  centers: Center[];
}

export function UsersClient({ users, centers }: Props) {
  const router = useRouter();
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [loading, setLoading] = useState(false);

  async function assignRole() {
    if (!assigningUser || !selectedCenter) return;
    setLoading(true);
    await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: assigningUser.id, center_id: selectedCenter, role: "manager" }),
    });
    setLoading(false);
    setAssigningUser(null);
    setSelectedCenter("");
    router.refresh();
  }

  async function removeRole(roleId: string) {
    if (!confirm("Remove this manager role?")) return;
    await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)] hidden sm:table-cell">Assigned Center</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">Role</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`${i > 0 ? "border-t border-[var(--border)]" : ""} hover:bg-[var(--border)]/30 transition-colors`}>
                <td className="px-5 py-4 text-[var(--text)]">{u.email ?? "—"}</td>
                <td className="px-5 py-4 text-[var(--subtext)] hidden sm:table-cell">{u.role?.center_name ?? "—"}</td>
                <td className="px-5 py-4">
                  {u.role ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                      {u.role.role}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--subtext)]">none</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => { setAssigningUser(u); setSelectedCenter(u.role?.center_id ?? ""); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all"
                      title="Assign to center"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    {u.role && (
                      <button
                        onClick={() => removeRole(u.role!.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Remove role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Assign modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <h2 className="font-lora text-lg font-semibold text-[var(--text)]">Assign Center</h2>
            <p className="text-sm text-[var(--subtext)]">{assigningUser.email}</p>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            >
              <option value="">Select a center...</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button onClick={assignRole} disabled={!selectedCenter || loading} className="flex-1">
                {loading ? "Saving..." : "Assign"}
              </Button>
              <Button variant="secondary" onClick={() => setAssigningUser(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
