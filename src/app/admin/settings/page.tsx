import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { HijriOffsetControl } from "./HijriOffsetControl";

export default async function AdminSettingsPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;

  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "hijri_offset")
    .single();

  const currentOffset = data ? parseInt(data.value, 10) || 0 : 0;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Settings</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Global app configuration</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
        <div>
          <p className="font-semibold text-[var(--text)]">Hijri Date Offset</p>
          <p className="text-sm text-[var(--subtext)] mt-1">
            Adjust the Hijri calendar by ±2 days to match local moon sighting.
            A value of <strong>+1</strong> advances all Hijri dates by one day;
            <strong> -1</strong> moves them back.
          </p>
        </div>
        <HijriOffsetControl currentOffset={currentOffset} />
      </div>
    </div>
  );
}
