"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Program, Center } from "@/types/database";

interface Props {
  programs: Program[];
  center: Center;
}

export function BookingsTab({ programs, center }: Props) {
  const bookablePrograms = programs.filter((e) => e.booking_type !== "none");

  if (bookablePrograms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">ℹ️</p>
        <p className="text-[var(--subtext)]">No registrations required for upcoming programs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bookablePrograms.map((program) => (
        <ProgramBookingCard key={program.id} program={program} center={center} />
      ))}
    </div>
  );
}

function ProgramBookingCard({ program, center }: { program: Program; center: Center }) {
  const dateStr = program.date
    ? new Date(program.date + "T00:00:00").toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Date TBA";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <p className="font-semibold text-[var(--text)]">{program.title}</p>
        <p className="text-sm text-[var(--subtext)] mt-0.5">{dateStr}</p>
      </div>
      <div className="p-4">
        <BookingAction program={program} center={center} />
      </div>
    </div>
  );
}

function BookingAction({ program, center }: { program: Program; center: Center }) {
  if (program.booking_type === "external" && program.booking_url) {
    return (
      <a href={program.booking_url} target="_blank" rel="noopener noreferrer">
        <Button className="w-full">Register Now</Button>
      </a>
    );
  }

  if (program.booking_type === "contact") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--subtext)]">Contact to register:</p>
        {center.phone && (
          <a href={`tel:${center.phone}`}>
            <Button variant="secondary" className="w-full">📞 {center.phone}</Button>
          </a>
        )}
        {center.email && (
          <a href={`mailto:${center.email}`}>
            <Button variant="secondary" className="w-full">✉️ {center.email}</Button>
          </a>
        )}
        {center.phone && (
          <a
            href={`https://wa.me/${center.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="w-full">💬 WhatsApp</Button>
          </a>
        )}
      </div>
    );
  }

  if (program.booking_type === "rsvp") {
    return <InlineRSVP programId={program.id} />;
  }

  return null;
}

function InlineRSVP({ programId }: { programId: string }) {
  const [form, setForm] = useState({ name: "", email: "", attendees: 1 });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: programId,
        name: form.name,
        email: form.email || null,
        attendees: form.attendees,
      }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-1">✅</p>
        <p className="font-semibold text-[var(--text)]">RSVP Confirmed!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--subtext)]">Attendees</label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.attendees}
          onChange={(e) =>
            setForm((f) => ({ ...f, attendees: parseInt(e.target.value) || 1 }))
          }
          className="w-20 h-12 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Confirm RSVP"}
      </Button>
    </form>
  );
}
