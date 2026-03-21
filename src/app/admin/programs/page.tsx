import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminProgramsTable } from "./AdminProgramsTable";

export default async function AdminProgramsPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: programs } = await db
    .from("events")
    .select("id, title, date, time, category, centers(name)")
    .order("date", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Programs</h1>
          <p className="text-sm text-[var(--subtext)] mt-1">{programs?.length ?? 0} total</p>
        </div>
        <Link
          href="/admin/programs/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] text-[#070D1F] text-sm font-semibold hover:bg-[#C9A84C]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Program
        </Link>
      </div>

      <AdminProgramsTable programs={programs ?? []} />
    </div>
  );
}
