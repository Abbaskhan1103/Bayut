import { notFound } from "next/navigation";

export const revalidate = 3600;
import { createClient } from "@/lib/supabase/server";

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_centers").select("id");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((c: any) => ({ id: c.id as string }));
}
import Image from "next/image";
import { Navigation } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarTab } from "@/components/centers/CalendarTab";
import { DonationsTab } from "@/components/centers/DonationsTab";
import { ContactTab } from "@/components/centers/ContactTab";
import { YouTubeLiveBanner } from "@/components/centers/YouTubeLiveBanner";
import { getHijriOffset } from "@/lib/settings";
import type { Center, Program } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CenterPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: center }, { data: programs }, hijriOffset] = await Promise.all([
    supabase.from("public_centers").select("id, name, suburb, address, lat, lng, phone, email, website, logo_url, youtube_channel_id, youtube_url, instagram_url, facebook_url, color_hex, bank_name, bsb, account_number, account_name, created_at").eq("id", id).single(),
    supabase
      .from("events")
      .select("*")
      .eq("center_id", id)
      .order("date", { ascending: true }),
    getHijriOffset(),
  ]);

  if (!center) notFound();

  // Check YouTube live status server-side so no client API call is needed
  let liveState: { live: boolean; videoId: string | null; title: string | null } = { live: false, videoId: null, title: null };
  if ((center as Center).youtube_channel_id) {
    try {
      const ytRes = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/youtube-live?channelId=${(center as Center).youtube_channel_id}`,
        { next: { revalidate: 60 } }
      );
      if (ytRes.ok) liveState = await ytRes.json();
    } catch { /* silently fail */ }
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-none overflow-hidden"
          style={{ backgroundColor: (center as Center).logo_url ? "transparent" : ((center as Center).color_hex ?? "#1E2D52") + "33" }}
        >
          {(center as Center).logo_url ? (
            <Image src={(center as Center).logo_url!} alt={(center as Center).name} width={112} height={112} sizes="56px" className="w-full h-full object-cover" />
          ) : "🕌"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-lora text-xl font-semibold text-[var(--text)]">
            {(center as Center).name}
          </h1>
          {(center as Center).suburb && (
            <p className="text-sm text-[var(--subtext)]">{(center as Center).suburb}, VIC</p>
          )}
        </div>
        {((center as Center).lat && (center as Center).lng) ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${(center as Center).lat},${(center as Center).lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-10 h-10 rounded-xl flex items-center justify-center bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </a>
        ) : (center as Center).address ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent((center as Center).address!)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-10 h-10 rounded-xl flex items-center justify-center bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </a>
        ) : null}
      </div>

      {/* Live banner */}
      {liveState.live && liveState.videoId && (
        <YouTubeLiveBanner videoId={liveState.videoId} title={liveState.title} />
      )}

      {/* Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="donations">Donate</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarTab
            centerId={id}
            initialPrograms={(programs ?? []) as Program[]}
            center={center as Center}
            hijriOffset={hijriOffset}
          />
        </TabsContent>

        <TabsContent value="donations">
          <DonationsTab center={center as Center} />
        </TabsContent>

        <TabsContent value="contact">
          <ContactTab center={center as Center} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
