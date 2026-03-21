import { requireAdmin } from "@/lib/admin/auth";
import { AdminProgramForm } from "@/components/admin/AdminProgramForm";

export default async function NewAdminProgramPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">New Program</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Create a program for any centre</p>
      </div>
      <AdminProgramForm />
    </div>
  );
}
