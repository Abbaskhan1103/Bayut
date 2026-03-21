import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const [
    { data: { users } },
    { data: roles },
    { data: centers },
  ] = await Promise.all([
    db.auth.admin.listUsers(),
    db.from("center_roles").select("*"),
    db.from("centers").select("id, name").order("name"),
  ]);

  // Build userId → role+centerName map
  const centerMap = Object.fromEntries((centers ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const roleMap = Object.fromEntries(
    (roles ?? []).map((r: { user_id: string; id: string; center_id: string; role: string }) => [
      r.user_id,
      { ...r, center_name: centerMap[r.center_id] ?? r.center_id },
    ])
  );

  const usersWithRoles = (users ?? []).map((u: { id: string; email?: string; created_at: string }) => ({
    ...u,
    role: roleMap[u.id] ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Users</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">{usersWithRoles.length} registered</p>
      </div>
      <UsersClient users={usersWithRoles} centers={centers ?? []} />
    </div>
  );
}
