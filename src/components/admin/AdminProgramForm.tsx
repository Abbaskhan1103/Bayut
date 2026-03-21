"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingType, EventCategory } from "@/types/database";

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "majlis", label: "Majlis / Aza" },
  { value: "lecture", label: "Lecture / Talk" },
  { value: "quran", label: "Quran" },
  { value: "youth", label: "Youth" },
  { value: "eid", label: "Eid / Celebration" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

type RepeatMode = "none" | "daily" | "weekly" | "custom";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateDates(startDate: string, endDate: string, mode: RepeatMode, customDays: Set<number>): string[] {
  const dates: string[] = [];
  const end = new Date(endDate + "T00:00:00");
  const cursor = new Date(startDate + "T00:00:00");
  if (mode === "none") return [startDate];
  while (cursor <= end) {
    const dow = cursor.getDay();
    if (
      mode === "daily" ||
      (mode === "weekly" && dow === new Date(startDate + "T00:00:00").getDay()) ||
      (mode === "custom" && customDays.has(dow))
    ) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

interface Center { id: string; name: string }

interface Props {
  centers: Center[];
}

export function AdminProgramForm({ centers }: Props) {
  const router = useRouter();

  const [centerId, setCenterId] = useState(centers[0]?.id ?? "");
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    booking_type: "none" as BookingType,
    booking_url: "",
    youtube_stream_url: "",
    category: "other" as EventCategory,
  });

  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [customDays, setCustomDays] = useState<Set<number>>(new Set());

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleCustomDay(dow: number) {
    setCustomDays((prev) => {
      const next = new Set(prev);
      if (next.has(dow)) { next.delete(dow); } else { next.add(dow); }
      return next;
    });
  }

  async function handleExtract() {
    if (!aiImage) return;
    setExtracting(true);
    setAiError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(aiImage);
      });
      const res = await fetch("/api/extract-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, imageMimeType: aiImage.type }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setPosterFile(aiImage);
      setForm((f) => ({
        ...f,
        title: result.title ?? f.title,
        date: result.date ?? f.date,
        time: result.time ?? f.time,
        description: result.description ?? f.description,
      }));
    } catch {
      setAiError("Could not extract details. Try again or fill in manually.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centerId) { setError("Please select a centre"); return; }
    setLoading(true);
    setError("");

    let poster_image_url: string | null = null;

    if (posterFile) {
      const ext = posterFile.name.split(".").pop();
      const path = `${centerId}/${Date.now()}.${ext}`;
      const fd = new FormData();
      fd.append("file", posterFile);
      fd.append("bucket", "posters");
      fd.append("path", path);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Image upload failed");
        setLoading(false);
        return;
      }
      const { url } = await uploadRes.json();
      poster_image_url = url;
    }

    const base = {
      title: form.title,
      description: form.description || null,
      time: form.time || null,
      booking_type: form.booking_type,
      booking_url: form.booking_url || null,
      poster_image_url,
      youtube_stream_url: form.youtube_stream_url || null,
      category: form.category,
    };

    const isRecurring = repeat !== "none" && form.date && repeatEndDate;
    const dates = isRecurring
      ? generateDates(form.date, repeatEndDate, repeat, customDays)
      : [form.date || null];

    if (dates.length === 0) {
      setError("No dates match the selected recurrence pattern.");
      setLoading(false);
      return;
    }

    const rows = dates.map((date) => ({ ...base, date }));
    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ center_id: centerId, rows }),
    });

    if (!res.ok) {
      setError("Failed to create program");
      setLoading(false);
      return;
    }

    router.push("/admin/programs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">

      {/* Centre selector */}
      <div className="flex flex-col gap-2">
        <Label>Centre *</Label>
        <select
          value={centerId}
          onChange={(e) => setCenterId(e.target.value)}
          required
          className="flex h-12 w-full items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
        >
          <option value="" disabled>Select a centre...</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* AI extraction */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">
          ✨ Auto-fill with AI
        </p>
        <div className="flex items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--subtext)] hover:border-[#C9A84C]/50 transition-colors">
              <span className="truncate">{aiImage ? aiImage.name : "Upload poster image..."}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAiImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            type="button"
            disabled={extracting || !aiImage}
            onClick={handleExtract}
            className="flex-none gap-1.5"
          >
            {extracting ? "Extracting..." : "Extract"}
          </Button>
        </div>
        {aiError && <p className="text-xs text-red-400">{aiError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Program Title *</Label>
        <Input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Majlis al-Hussain"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Program details..."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v as EventCategory }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Time</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label>Repeat</Label>
          <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Does not repeat</SelectItem>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekly">Every week</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {repeat === "custom" && (
          <div className="flex flex-col gap-2">
            <Label>Repeats on</Label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleCustomDay(i)}
                  className={`w-10 h-10 rounded-full text-xs font-semibold border transition-all ${
                    customDays.has(i)
                      ? "bg-[#C9A84C] text-[#070D1F] border-[#C9A84C]"
                      : "bg-transparent text-[var(--subtext)] border-[var(--border)]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {repeat !== "none" && (
          <div className="flex flex-col gap-2">
            <Label>End date</Label>
            <Input
              type="date"
              value={repeatEndDate}
              min={form.date}
              required
              onChange={(e) => setRepeatEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Program Poster</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
          className="text-sm text-[var(--subtext)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Booking Type</Label>
        <Select
          value={form.booking_type}
          onValueChange={(v) => setForm((f) => ({ ...f, booking_type: v as BookingType }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (informational)</SelectItem>
            <SelectItem value="rsvp">RSVP (in-app form)</SelectItem>
            <SelectItem value="external">External link</SelectItem>
            <SelectItem value="contact">Contact to register</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.booking_type === "external" && (
        <div className="flex flex-col gap-2">
          <Label>Booking URL</Label>
          <Input
            type="url"
            value={form.booking_url}
            onChange={(e) => setForm((f) => ({ ...f, booking_url: e.target.value }))}
            placeholder="https://trybooking.com/..."
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>YouTube Live Stream URL</Label>
        <Input
          type="url"
          value={form.youtube_stream_url}
          onChange={(e) => setForm((f) => ({ ...f, youtube_stream_url: e.target.value }))}
          placeholder="https://youtube.com/live/..."
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/programs")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Create Program"}
        </Button>
      </div>
    </form>
  );
}
