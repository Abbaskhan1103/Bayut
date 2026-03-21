"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/centers", label: "Centers", icon: MapPin },
  { href: "/programs", label: "Programs", icon: CalendarDays },
  { href: "/account", label: "Account", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  // Hide on dashboard and login
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] px-4 rounded-xl transition-all",
                active
                  ? "text-[#C9A84C]"
                  : "text-[var(--subtext)] hover:text-[var(--text)]"
              )}
            >
              <Icon
                className={cn("w-6 h-6 transition-transform", active && "scale-110")}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn("text-[10px] font-semibold tracking-wide", active ? "opacity-100" : "opacity-60")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
