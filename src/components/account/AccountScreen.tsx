"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { LayoutDashboard, ShieldCheck, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  user: { email: string; id: string } | null;
  centerRole: { center_id: string; center_name: string } | null;
  isAdmin: boolean;
}

export function AccountScreen({ user, centerRole, isAdmin }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/home");
    router.refresh();
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
            <Image src="/bayut-app-icon.svg" alt="Bayut" width={64} height={64} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-lora text-2xl font-semibold text-[var(--text)]">My Account</h2>
            <p className="text-sm text-[var(--subtext)] max-w-[260px]">
              Sign in or create an account to favourite centres and track your events.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Link href="/login">
            <Button className="w-full gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>

        <p className="text-xs text-[var(--subtext)] max-w-[260px]">
          Centre Manager?{" "}
          <a
            href="mailto:abbasalikhan.au@gmail.com"
            className="text-[#C9A84C] hover:underline"
          >
            Contact us
          </a>{" "}
          to get your centre set up.
        </p>
      </div>
    );
  }

  // Logged in — derive initials from email
  const initial = user.email[0].toUpperCase();
  const roleBadge = isAdmin
    ? { label: "Admin", color: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30" }
    : centerRole
    ? { label: "Centre Manager", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" }
    : { label: "Community Member", color: "text-[var(--subtext)] bg-[var(--surface)] border-[var(--border)]" };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Profile card */}
      <div className="flex flex-col items-center gap-3 py-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C]/40 flex items-center justify-center">
          <span className="font-lora text-2xl font-bold text-[#C9A84C]">{initial}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-[var(--text)]">{user.email}</p>
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full border",
            roleBadge.color
          )}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Role-based shortcuts */}
      {(isAdmin || centerRole) && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--subtext)] px-1">
            Quick Access
          </p>

          {centerRole && (
            <Link href="/dashboard">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-none">
                  <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{centerRole.center_name}</p>
                  <p className="text-xs text-[var(--subtext)]">Manage events, bookings & centre info</p>
                </div>
                <svg className="w-4 h-4 text-[var(--subtext)] flex-none" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-none">
                  <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">Admin Panel</p>
                  <p className="text-xs text-[var(--subtext)]">Manage centres, users & subscriptions</p>
                </div>
                <svg className="w-4 h-4 text-[var(--subtext)] flex-none" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Sign out */}
      <div className="mt-auto pt-2">
        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
