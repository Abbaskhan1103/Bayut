"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Center } from "@/types/database";

interface Props {
  center: Center;
  onSuccess: () => void;
}

export function CenterSocialsForm({ center, onSuccess }: Props) {
  const [form, setForm] = useState({
    youtube_url: center.youtube_url ?? "",
    instagram_url: center.instagram_url ?? "",
    facebook_url: center.facebook_url ?? "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(center.logo_url ?? null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let logo_url = center.logo_url ?? null;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${center.id}/logo.${ext}`;
      const fd = new FormData();
      fd.append("file", logoFile);
      fd.append("bucket", "logos");
      fd.append("path", path);
      const uploadRes = await fetch("/api/dashboard/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Logo upload failed");
        setLoading(false);
        return;
      }
      const { url } = await uploadRes.json();
      logo_url = url;
    }

    await fetch("/api/dashboard/centers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logo_url,
        youtube_url: form.youtube_url || null,
        instagram_url: form.instagram_url || null,
        facebook_url: form.facebook_url || null,
      }),
    });

    setSaved(true);
    setLoading(false);
    onSuccess();
    setTimeout(() => setSaved(false), 2000);
  }

  const socialFields = [
    { key: "youtube_url" as const, label: "YouTube URL", placeholder: "https://youtube.com/@yourchannel" },
    { key: "instagram_url" as const, label: "Instagram URL", placeholder: "https://instagram.com/yourhandle" },
    { key: "facebook_url" as const, label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Logo upload */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-[var(--text)]">Center Logo</label>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden flex-none cursor-pointer hover:border-[#C9A84C]/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🕌</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {logoPreview ? "Change Logo" : "Upload Logo"}
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
            <p className="text-xs text-[var(--subtext)]">PNG, JPG, SVG · Recommended 512×512</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      {/* Social links */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[var(--subtext)]">
          Social links appear in the Contact tab of your center&apos;s public page.
        </p>
        {socialFields.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--text)]">{label}</label>
            <input
              type="url"
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {saved ? "Saved!" : loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
