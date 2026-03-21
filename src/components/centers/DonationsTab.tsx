"use client";

import { useToast } from "@/components/ui/toast";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Center } from "@/types/database";

interface Props {
  center: Center;
}

export function DonationsTab({ center }: Props) {
  const hasDetails = center.bank_name || center.account_name || center.bsb || center.account_number;

  if (!hasDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--subtext)]">No donation details available.</p>
      </div>
    );
  }

  const fields = [
    center.bank_name    && { label: "Bank",           value: center.bank_name,    mono: false },
    center.account_name && { label: "Account Name",   value: center.account_name, mono: false },
    center.bsb          && { label: "BSB",            value: center.bsb,          mono: true  },
    center.account_number && { label: "Account Number", value: center.account_number, mono: true },
  ].filter(Boolean) as { label: string; value: string; mono: boolean }[];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--subtext)]">
        Support {center.name} with a direct bank transfer.
      </p>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {fields.map((field, i) => (
          <BankField
            key={field.label}
            label={field.label}
            value={field.value}
            mono={field.mono}
            last={i === fields.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function BankField({
  label,
  value,
  mono = false,
  last = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  const { showToast, ToastComponent } = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    showToast("Copied ✓", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {ToastComponent}
      <div
        className={`flex items-center justify-between px-4 py-3.5 ${
          !last ? "border-b border-[var(--border)]" : ""
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--subtext)]">{label}</span>
          <span
            className={`text-sm text-[var(--text)] ${mono ? "font-mono tracking-wider" : "font-medium"}`}
          >
            {value}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-[var(--subtext)] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all active:scale-90"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </>
  );
}
