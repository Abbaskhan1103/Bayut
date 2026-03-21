import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 flex bg-[var(--background)] overflow-hidden z-50">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
