"use client";

import { usePathname } from "next/navigation";
import { StatusBar } from "./StatusBar";
import { BottomTabBar } from "./BottomTabBar";

export function ConditionalMobileChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <StatusBar />
      <BottomTabBar />
    </>
  );
}
