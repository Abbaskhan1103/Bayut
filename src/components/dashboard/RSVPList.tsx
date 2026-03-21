"use client";

import type { RSVP } from "@/types/database";
import { Users } from "lucide-react";

interface Props {
  rsvps: RSVP[];
  programTitle: string;
}

export function RSVPList({ rsvps, programTitle }: Props) {
  const totalAttendees = rsvps.reduce((sum, r) => sum + r.attendees, 0);

  if (rsvps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--subtext)]">No RSVPs yet for {programTitle}.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-[var(--subtext)]">
        <Users className="w-4 h-4" />
        <span>
          {rsvps.length} registration{rsvps.length !== 1 ? "s" : ""} · {totalAttendees} total attendees
        </span>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {rsvps.map((rsvp, i) => (
          <div
            key={rsvp.id}
            className={`flex items-center justify-between px-4 py-3 ${
              i < rsvps.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            <div>
              <p className="font-medium text-[var(--text)] text-sm">{rsvp.name}</p>
              {rsvp.email && (
                <p className="text-xs text-[var(--subtext)]">{rsvp.email}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-[var(--subtext)]">
              <Users className="w-3 h-3" />
              <span>{rsvp.attendees}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
