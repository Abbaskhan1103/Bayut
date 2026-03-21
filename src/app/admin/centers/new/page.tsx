import { requireAdmin } from "@/lib/admin/auth";
import { CenterForm } from "../CenterForm";

export default async function NewCenterPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">New Center</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Create a new Islamic center</p>
      </div>
      <CenterForm />
    </div>
  );
}
