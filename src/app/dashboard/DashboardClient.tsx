"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgramForm } from "@/components/dashboard/ProgramForm";
import { RSVPList } from "@/components/dashboard/RSVPList";
import { BankDetailsForm } from "@/components/dashboard/BankDetailsForm";
import { CenterSocialsForm } from "@/components/dashboard/CenterSocialsForm";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { YouTubeSyncButton } from "@/components/dashboard/YouTubeSyncButton";
import type { Center, Program, RSVP } from "@/types/database";

interface Props {
  center: Center;
  programs: Program[];
  rsvps: RSVP[];
}

export function DashboardClient({ center, programs: initialPrograms, rsvps: initialRSVPs }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [rsvps] = useState(initialRSVPs);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [expandedRSVPs, setExpandedRSVPs] = useState<Set<string>>(new Set());
  const router = useRouter();

  function toggleRSVPs(programId: string) {
    setExpandedRSVPs((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) { next.delete(programId); } else { next.add(programId); }
      return next;
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function deleteProgram(programId: string) {
    if (!confirm("Delete this program?")) return;
    await fetch(`/api/dashboard/events/${programId}`, { method: "DELETE" });
    setPrograms((prev) => prev.filter((p) => p.id !== programId));
  }

  function onProgramSuccess() {
    setShowProgramForm(false);
    setEditingProgram(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Dashboard header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-lora text-xl font-semibold text-[var(--text)]">{center.name}</h1>
          <p className="text-xs text-[var(--subtext)]">Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <form action="/api/create-portal-session" method="POST">
            <Button type="submit" variant="secondary" size="sm" className="gap-1">
              <CreditCard className="w-4 h-4" />
              Billing
            </Button>
          </form>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <Tabs defaultValue="programs">
          <TabsList className="w-full max-w-sm">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Programs tab */}
          <TabsContent value="programs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--subtext)]">
                  {programs.length} program{programs.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowProgramForm(true)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" /> New Program
                </Button>
              </div>

              {center.youtube_channel_id && (
                <YouTubeSyncButton
                  centerId={center.id}
                  onSynced={() => router.refresh()}
                />
              )}

              {programs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--subtext)]">No programs yet. Create your first program!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">{program.title}</p>
                          <p className="text-sm text-[var(--subtext)] mt-0.5">
                            {program.date ?? "Date TBA"}
                            {program.time ? ` · ${program.time}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {program.booking_type}
                            </Badge>
                            {program.is_live && (
                              <Badge variant="destructive" className="text-[10px]">
                                🔴 LIVE
                              </Badge>
                            )}
                            {program.booking_type === "rsvp" && (
                              <button
                                onClick={() => toggleRSVPs(program.id)}
                                className="flex items-center gap-1 text-xs text-[var(--subtext)] hover:text-[var(--text)] transition-colors"
                              >
                                {rsvps.filter((r) => r.event_id === program.id).length} RSVPs
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedRSVPs.has(program.id) ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-none">
                          <button
                            onClick={() => setEditingProgram(program)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProgram(program.id)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--subtext)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expandedRSVPs.has(program.id) && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <RSVPList
                            rsvps={rsvps.filter((r) => r.event_id === program.id)}
                            programTitle={program.title}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bank details tab */}
          <TabsContent value="bank">
            <div className="max-w-md">
              <BankDetailsForm
                center={center}
                onSuccess={() => router.refresh()}
              />
            </div>
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings">
            <div className="max-w-md">
              <CenterSocialsForm
                center={center}
                onSuccess={() => router.refresh()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Program form dialog */}

      <Dialog
        open={showProgramForm || !!editingProgram}
        onOpenChange={(open) => {
          if (!open) {
            setShowProgramForm(false);
            setEditingProgram(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "New Program"}</DialogTitle>
          </DialogHeader>
          <ProgramForm
            centerId={center.id}
            program={editingProgram ?? undefined}
            onSuccess={onProgramSuccess}
            onCancel={() => {
              setShowProgramForm(false);
              setEditingProgram(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

