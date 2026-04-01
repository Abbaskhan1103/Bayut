"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

type FieldKey =
  | "cash"
  | "foreignCurrency"
  | "debtsReceivable"
  | "inKindPossessions"
  | "financialDues"
  | "prevCash"
  | "prevFungible"
  | "prevNonFungible"
  | "commercialDebts"
  | "currentYearSustenanceDebts"
  | "prevYearSustenanceDebts"
  | "previouslyTaxedAssets"
  | "priorImamPayments"
  | "priorSadaPayments";

const defaultFields: Record<FieldKey, string> = {
  cash: "",
  foreignCurrency: "",
  debtsReceivable: "",
  inKindPossessions: "",
  financialDues: "",
  prevCash: "",
  prevFungible: "",
  prevNonFungible: "",
  commercialDebts: "",
  currentYearSustenanceDebts: "",
  prevYearSustenanceDebts: "",
  previouslyTaxedAssets: "",
  priorImamPayments: "",
  priorSadaPayments: "",
};

function CurrencyInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[var(--text)]">{label}</label>
      {hint && <p className="text-xs text-[var(--subtext)] leading-snug">{hint}</p>}
      <div className="relative mt-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--subtext)] text-sm">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-4 text-base font-semibold text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        />
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-[var(--text)]">{title}</p>
          {subtitle && <p className="text-xs text-[var(--subtext)] mt-0.5">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-[var(--subtext)] shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--subtext)] shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[var(--border)]">
          <div className="pt-4 flex flex-col gap-4">{children}</div>
        </div>
      )}
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
  highlight?: "gold" | "green" | "blue";
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        !last ? "border-b border-[var(--border)]" : ""
      } ${
        highlight === "gold"
          ? "bg-[#C9A84C]/8"
          : highlight === "green"
          ? "bg-emerald-500/8"
          : highlight === "blue"
          ? "bg-sky-500/8"
          : ""
      }`}
    >
      <div>
        <p
          className={`font-semibold ${
            highlight === "gold"
              ? "text-[#C9A84C]"
              : highlight === "green"
              ? "text-emerald-400"
              : highlight === "blue"
              ? "text-sky-400"
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
            : highlight === "blue"
            ? "text-sky-400"
            : "text-[var(--text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function KhumsCalculator() {
  const [fields, setFields] = useState<Record<FieldKey, string>>(defaultFields);

  function set(key: FieldKey) {
    return (v: string) => setFields((f) => ({ ...f, [key]: v }));
  }

  const g = (key: FieldKey) => parseNumber(fields[key]);

  // Surplus assets (what you own)
  const totalSurplus =
    g("cash") +
    g("foreignCurrency") +
    g("debtsReceivable") +
    g("inKindPossessions") +
    g("financialDues") +
    g("prevCash") +
    g("prevFungible") +
    g("prevNonFungible");

  // Deductions (what you owe)
  const totalDeductions =
    g("commercialDebts") +
    g("currentYearSustenanceDebts") +
    g("prevYearSustenanceDebts") +
    g("previouslyTaxedAssets");

  // Net khums base
  const netAmount = Math.max(0, totalSurplus - totalDeductions);
  const baseKhums = netAmount / 5;

  // Split 50/50 minus prior payments
  const sahmImam = Math.max(0, baseKhums / 2 - g("priorImamPayments"));
  const sahmSada = Math.max(0, baseKhums / 2 - g("priorSadaPayments"));
  const totalKhumsDue = sahmImam + sahmSada;

  const hasAnyInput = Object.values(fields).some((v) => v !== "");

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Khums Calculator</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">
          Calculate your annual Khums based on surplus assets, debts, and prior payments
        </p>
      </div>

      {/* Section 1: Surplus Assets */}
      <Section
        title="Surplus Assets"
        subtitle="Everything you own that is subject to khums"
        defaultOpen
      >
        <CurrencyInput
          label="Cash & Currency (AUD)"
          hint="Cash on hand and in bank accounts on your khums due date"
          value={fields.cash}
          onChange={set("cash")}
        />
        <CurrencyInput
          label="Foreign Currency (AUD equivalent)"
          hint="Convert any foreign currency you hold to AUD"
          value={fields.foreignCurrency}
          onChange={set("foreignCurrency")}
        />
        <CurrencyInput
          label="Debts Receivable"
          hint="Money owed to you that you expect to be repaid"
          value={fields.debtsReceivable}
          onChange={set("debtsReceivable")}
        />
        <CurrencyInput
          label="In-Kind Possessions"
          hint="Buildings, farms, factories, household items not used for daily sustenance"
          value={fields.inKindPossessions}
          onChange={set("inKindPossessions")}
        />
        <CurrencyInput
          label="Financial Dues"
          hint="Key premiums, agricultural land fees, land revival dues"
          value={fields.financialDues}
          onChange={set("financialDues")}
        />
        <CurrencyInput
          label="Previously Utilised Cash"
          hint="Cash that was already subject to khums before your current khums due date"
          value={fields.prevCash}
          onChange={set("prevCash")}
        />
        <CurrencyInput
          label="Previously Utilised Fungible Items"
          hint="Machinery and factory products that were used in prior periods"
          value={fields.prevFungible}
          onChange={set("prevFungible")}
        />
        <CurrencyInput
          label="Previously Utilised Non-Fungible Items"
          hint="Unique items (e.g. paintings) valued at the time of utilisation"
          value={fields.prevNonFungible}
          onChange={set("prevNonFungible")}
        />
      </Section>

      {/* Section 2: Deductions */}
      <Section
        title="Deductions"
        subtitle="Debts and liabilities that reduce your khums base"
      >
        <CurrencyInput
          label="Commercial Debts"
          hint="All outstanding business obligations you owe to others"
          value={fields.commercialDebts}
          onChange={set("commercialDebts")}
        />
        <CurrencyInput
          label="Current Year Sustenance Debts"
          hint="Borrowing for housing, vehicles or living expenses taken in the current financial year"
          value={fields.currentYearSustenanceDebts}
          onChange={set("currentYearSustenanceDebts")}
        />
        <CurrencyInput
          label="Previous Year Sustenance Debts"
          hint="Earlier borrowing for living expenses where the asset is still retained"
          value={fields.prevYearSustenanceDebts}
          onChange={set("prevYearSustenanceDebts")}
        />
        <CurrencyInput
          label="Previously Taxed Assets"
          hint="Amount of assets already subjected to khums in prior years"
          value={fields.previouslyTaxedAssets}
          onChange={set("previouslyTaxedAssets")}
        />
      </Section>

      {/* Section 3: Prior Payments */}
      <Section
        title="Prior Khums Payments This Year"
        subtitle="Amounts already paid toward each portion — deducted from what's due"
      >
        <CurrencyInput
          label="Prior Sahm Al-Imam Payments"
          hint="Amounts already paid toward the Imam's (AS) portion this year"
          value={fields.priorImamPayments}
          onChange={set("priorImamPayments")}
        />
        <CurrencyInput
          label="Prior Sahm Al-Sada Payments"
          hint="Amounts already paid toward eligible recipients (Sada) this year"
          value={fields.priorSadaPayments}
          onChange={set("priorSadaPayments")}
        />
      </Section>

      {/* Results */}
      {hasAnyInput && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <ResultRow
            label="Total Surplus"
            value={formatAUD(totalSurplus)}
            sublabel="Sum of all assets subject to khums"
          />
          <ResultRow
            label="Total Deductions"
            value={formatAUD(totalDeductions)}
            sublabel="Debts and liabilities"
          />
          <ResultRow
            label="Net Khums Base"
            value={formatAUD(netAmount)}
            sublabel="Surplus minus deductions"
          />
          <ResultRow
            label="Total Khums (1/5)"
            value={formatAUD(baseKhums)}
            sublabel="20% of net base"
            highlight="gold"
          />
          <ResultRow
            label="Sahm Al-Imam Due"
            value={formatAUD(sahmImam)}
            sublabel="Half of khums, minus prior Imam payments"
            highlight="blue"
          />
          <ResultRow
            label="Sahm Al-Sada Due"
            value={formatAUD(sahmSada)}
            sublabel="Half of khums, minus prior Sada payments"
            highlight="green"
          />
          <ResultRow
            label="Total Khums Due"
            value={formatAUD(totalKhumsDue)}
            sublabel="Sahm Al-Imam + Sahm Al-Sada"
            highlight="gold"
            last
          />
        </div>
      )}

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--subtext)] leading-relaxed">
          <strong className="text-[var(--text)]">Note:</strong> Khums is 1/5th (20%) of your annual
          surplus after deducting debts and liabilities. It is split equally between Sahm Al-Imam
          (the Imam&apos;s portion) and Sahm Al-Sada (eligible recipients). Exempt items include
          inherited cash, a wife&apos;s dowry, personal use items, and debts unlikely to be repaid.
          Consult your Marja&apos;a for rulings specific to your situation.
        </p>
      </div>
    </div>
  );
}
