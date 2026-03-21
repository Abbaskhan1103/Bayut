import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CentersTable } from "./CentersTable";

export default async function AdminCentersPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data: centers } = await db
    .from("centers")
    .select("*, events(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Centers</h1>
          <p className="text-sm text-[var(--subtext)] mt-1">{centers?.length ?? 0} total</p>
        </div>
        <Link
          href="/admin/centers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] text-[#070D1F] text-sm font-semibold hover:bg-[#C9A84C]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Center
        </Link>
      </div>

      <CentersTable centers={centers ?? []} />
    </div>
  );
}
