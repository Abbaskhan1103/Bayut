"use client";

import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import Image from "next/image";

const routeTitles: Record<string, string> = {
  "/home": "Bayut",
  "/centers": "Islamic Centers",
  "/ibadah": "Ibadah",
  "/ibadah/tasbih": "Tasbih",
  "/ibadah/qadha": "Qadha Tracker",
  "/ibadah/khums": "Khums Calculator",
  "/account": "Account",
};

export function StatusBar() {
  const pathname = usePathname();
  // Hide on dashboard
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) {
    return null;
  }

  const isHome = pathname === "/home";
  const title = Object.entries(routeTitles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname === route || pathname.startsWith(route + "/"))?.[1] ?? "Bayut";

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        {isHome ? (
          <div className="flex items-center gap-2">
            <Image
              src="/bayut-favicon-light.svg"
              alt="Bayut"
              width={28}
              height={28}
              className="w-7 h-7"
              priority
            />
            <span className="font-lora font-semibold text-lg text-[var(--text)]">Bayut</span>
          </div>
        ) : (
          <span className="font-lora font-semibold text-lg text-[var(--text)]">{title}</span>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
