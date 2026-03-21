"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Center } from "@/types/database";

interface Props {
  center?: Center;
}

export function CenterForm({ center }: Props) {
  const router = useRouter();
  const isEdit = !!center;

  const [form, setForm] = useState({
    name: center?.name ?? "",
    suburb: center?.suburb ?? "",
    address: center?.address ?? "",
    phone: center?.phone ?? "",
    email: center?.email ?? "",
    website: center?.website ?? "",
    youtube_channel_id: center?.youtube_channel_id ?? "",
    youtube_url: center?.youtube_url ?? "",
    instagram_url: center?.instagram_url ?? "",
    facebook_url: center?.facebook_url ?? "",
    color_hex: center?.color_hex ?? "#C9A84C",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(center?.logo_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadLogo(file: File, centerId: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "logos");
    fd.append("path", `${centerId}/logo.${ext}`);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) { setError("Logo upload failed"); return null; }
    const { url } = await res.json();
    return url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      suburb: form.suburb || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      youtube_channel_id: form.youtube_channel_id || null,
      youtube_url: form.youtube_url || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      color_hex: form.color_hex || null,
    };

    // For edits, upload logo first so we can include logo_url in the same PATCH
    if (isEdit && logoFile) {
      const logoUrl = await uploadLogo(logoFile, center.id);
      if (!logoUrl) { setLoading(false); return; }
      payload.logo_url = logoUrl;
    }

    const res = isEdit
      ? await fetch(`/api/admin/centers/${center.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/centers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    // For new centers, upload logo after creation (need the ID)
    if (!isEdit && logoFile) {
      const { id: newId } = await res.clone().json();
      const logoUrl = await uploadLogo(logoFile, newId);
      if (logoUrl) {
        await fetch(`/api/admin/centers/${newId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: logoUrl }),
        });
      }
    }

    router.push("/admin/centers");
    router.refresh();
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div key={key} className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--text)]">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">Basic Info</p>

        {/* Logo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--text)]">Logo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden flex-none cursor-pointer hover:border-[#C9A84C]/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo preview" width={64} height={64} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-2xl">🕌</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                {logoPreview ? "Change" : "Upload Logo"}
              </Button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 text-left"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-[var(--subtext)]">PNG, JPG, SVG · Max 5MB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        {field("name", "Center Name *")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("suburb", "Suburb")}
          {field("address", "Full Address")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("phone", "Phone")}
          {field("email", "Email", "email")}
        </div>
        {field("website", "Website", "url", "https://")}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">Social & YouTube</p>
        {field("youtube_channel_id", "YouTube Channel ID", "text", "UCxxxxxxxxxxxxxxxx")}
        {field("youtube_url", "YouTube URL", "url", "https://youtube.com/@channel")}
        {field("instagram_url", "Instagram URL", "url", "https://instagram.com/handle")}
        {field("facebook_url", "Facebook URL", "url", "https://facebook.com/page")}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">Appearance</p>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--text)]">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                className="w-12 h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer p-1"
              />
              <span className="text-sm text-[var(--subtext)]">{form.color_hex}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Center"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/centers")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
