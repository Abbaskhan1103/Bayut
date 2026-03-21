import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminProgramForm } from "@/components/admin/AdminProgramForm";

export default async function NewAdminProgramPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: centers } = await db
    .from("centers")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">New Program</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Create a program for any centre</p>
      </div>
      <AdminProgramForm centers={centers ?? []} />
    </div>
  );
}
