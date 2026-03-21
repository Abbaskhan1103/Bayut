"use client";

import { useState } from "react";

function formatAUD(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumber(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function KhumsCalculator() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");

  const incomeNum = parseNumber(income);
  const expensesNum = parseNumber(expenses);
  const savings = Math.max(0, incomeNum - expensesNum);
  const khums = savings * 0.2;
  const yours = savings * 0.8;

  const hasValues = incomeNum > 0 || expensesNum > 0;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Khums Calculator</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">
          Calculate your annual Khums (20% of net savings)
        </p>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text)]">Annual Income (AUD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--subtext)] text-sm">$</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full h-14 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-4 text-lg font-semibold text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text)]">Annual Expenses (AUD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--subtext)] text-sm">$</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0.00"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full h-14 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-4 text-lg font-semibold text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {hasValues && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <ResultRow
            label="Net Savings"
            value={formatAUD(savings)}
            sublabel="Income − Expenses"
          />
          <ResultRow
            label="Khums Due"
            value={formatAUD(khums)}
            sublabel="20% of Net Savings"
            highlight="gold"
          />
          <ResultRow
            label="Yours to Keep"
            value={formatAUD(yours)}
            sublabel="80% of Net Savings"
            highlight="green"
            last
          />
        </div>
      )}

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--subtext)] leading-relaxed">
          <strong className="text-[var(--text)]">Note:</strong> Khums is 1/5th (20%) of your annual
          surplus savings after deducting necessary living expenses. Consult your Marja&apos;a for
          specific rulings applicable to your situation.
        </p>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  sublabel,
  highlight,
  last = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: "gold" | "green";
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        !last ? "border-b border-[var(--border)]" : ""
      } ${highlight === "gold" ? "bg-[#C9A84C]/8" : highlight === "green" ? "bg-emerald-500/8" : ""}`}
    >
      <div>
        <p
          className={`font-semibold ${
            highlight === "gold"
              ? "text-[#C9A84C]"
              : highlight === "green"
              ? "text-emerald-400"
              : "text-[var(--text)]"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-[var(--subtext)]">{sublabel}</p>
      </div>
      <p
        className={`text-xl font-bold tabular-nums ${
          highlight === "gold"
            ? "text-[#C9A84C]"
            : highlight === "green"
            ? "text-emerald-400"
            : "text-[var(--text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
