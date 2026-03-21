import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CenterForm } from "../../CenterForm";
import type { Center } from "@/types/database";

export default async function EditCenterPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data: center } = await db.from("centers").select("*").eq("id", id).single();
  if (!center) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Edit Center</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">{center.name}</p>
      </div>
      <CenterForm center={center as Center} />
    </div>
  );
}
