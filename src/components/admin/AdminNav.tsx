"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Building2, Users, CreditCard, Settings, LogOut, Home, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/centers", label: "Centers", icon: Building2 },
  { href: "/admin/programs", label: "Programs", icon: CalendarDays },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-14 md:w-56 flex-none flex flex-col border-r border-[var(--border)] bg-[var(--surface)] h-full">
      {/* Logo */}
      <div className="px-3 md:px-6 py-5 border-b border-[var(--border)] flex items-center justify-center md:block">
        <p className="font-lora font-semibold text-[var(--text)] hidden md:block">Bayut</p>
        <p className="text-xs text-[#C9A84C] hidden md:block">Admin Portal</p>
        <span className="md:hidden w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
          <span className="text-[#C9A84C] text-xs font-bold">B</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-2 md:p-3 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                  : "text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--border)]"
              }`}
            >
              <Icon className="w-4 h-4 flex-none" />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-2 md:p-3 border-t border-[var(--border)] flex flex-col gap-1">
        <Link
          href="/"
          title="Home"
          className="flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all"
        >
          <Home className="w-4 h-4 flex-none" />
          <span className="hidden md:block">Home</span>
        </Link>
        <button
          onClick={signOut}
          title="Sign Out"
          className="flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--subtext)] hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4 flex-none" />
          <span className="hidden md:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
