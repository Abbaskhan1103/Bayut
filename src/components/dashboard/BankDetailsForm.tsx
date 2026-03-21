"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Center } from "@/types/database";

interface Props {
  center: Center;
  onSuccess: () => void;
}

export function BankDetailsForm({ center, onSuccess }: Props) {
  const [form, setForm] = useState({
    bank_name: center.bank_name ?? "",
    account_name: center.account_name ?? "",
    bsb: center.bsb ?? "",
    account_number: center.account_number ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/dashboard/centers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_name: form.bank_name || null,
        account_name: form.account_name || null,
        bsb: form.bsb || null,
        account_number: form.account_number || null,
      }),
    });
    setSaved(true);
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Bank Name</Label>
        <Input
          value={form.bank_name}
          onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
          placeholder="Commonwealth Bank"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Account Name</Label>
        <Input
          value={form.account_name}
          onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
          placeholder="Islamic Centre Name Inc."
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>BSB</Label>
        <Input
          value={form.bsb}
          onChange={(e) => setForm((f) => ({ ...f, bsb: e.target.value }))}
          placeholder="062-000"
          maxLength={7}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Account Number</Label>
        <Input
          value={form.account_number}
          onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
          placeholder="12345678"
        />
      </div>
      {saved && <p className="text-sm text-emerald-400">✓ Bank details saved</p>}
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? "Saving..." : "Save Bank Details"}
      </Button>
    </form>
  );
}
