import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { AccountScreen } from "@/components/account/AccountScreen";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let centerRole: { center_id: string; center_name: string } | null = null;
  let isAdmin = false;

  if (user) {
    isAdmin = isAdminEmail(user.email);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roleData } = await (supabase as any)
      .from("center_roles")
      .select("center_id, centers(name)")
      .eq("user_id", user.id)
      .single() as {
        data: { center_id: string; centers: { name: string } | null } | null;
      };

    if (roleData?.center_id) {
      centerRole = {
        center_id: roleData.center_id,
        center_name: roleData.centers?.name ?? "My Centre",
      };
    }
  }

  return (
    <AccountScreen
      user={user ? { email: user.email ?? "", id: user.id } : null}
      centerRole={centerRole}
      isAdmin={isAdmin}
    />
  );
}
