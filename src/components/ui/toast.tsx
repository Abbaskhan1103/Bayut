"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
}

export function Toast({ message, variant = "default", visible }: ToastProps) {
  const variants = {
    default: "bg-[var(--surface)] border-[var(--border)] text-[var(--text)]",
    success: "bg-emerald-900/80 border-emerald-700 text-emerald-200",
    destructive: "bg-red-900/80 border-red-700 text-red-200",
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all duration-300",
        variants[variant],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      {message}
    </div>
  );
}

// Simple hook for toast notifications
export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback((message: string, variant: ToastVariant = "default") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, variant });
    timerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} variant={toast.variant} visible={!!toast} />
  ) : null;

  return { showToast, ToastComponent };
}
