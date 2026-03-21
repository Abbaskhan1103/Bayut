import { MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";
import type { Center } from "@/types/database";

function YtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  );
}

function IgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12c0-3.2 0-3.6.1-4.8.1-3.3 1.7-4.8 4.9-4.9 1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
    </svg>
  );
}

function FbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"/>
    </svg>
  );
}

interface Props {
  center: Center;
}

export function ContactTab({ center }: Props) {
  const mapsUrl = center.address
    ? `https://maps.google.com/?q=${encodeURIComponent(center.address)}`
    : center.lat && center.lng
    ? `https://maps.google.com/?q=${center.lat},${center.lng}`
    : null;

  const contactItems = [
    {
      icon: MapPin,
      label: "Address",
      value: center.address ?? (center.suburb ? `${center.suburb}, VIC` : null),
      href: mapsUrl,
    },
    {
      icon: Phone,
      label: "Phone",
      value: center.phone,
      href: center.phone ? `tel:${center.phone}` : null,
    },
    {
      icon: Mail,
      label: "Email",
      value: center.email,
      href: center.email ? `mailto:${center.email}` : null,
    },
    {
      icon: Globe,
      label: "Website",
      value: center.website,
      href: center.website,
      external: true,
    },
  ].filter((item) => item.value);

  const socialItems = [
    {
      icon: YtIcon,
      label: "YouTube",
      value: center.youtube_url,
      href: center.youtube_url,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      icon: IgIcon,
      label: "Instagram",
      value: center.instagram_url,
      href: center.instagram_url,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      icon: FbIcon,
      label: "Facebook",
      value: center.facebook_url,
      href: center.facebook_url,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ].filter((item) => item.value);

  if (contactItems.length === 0 && socialItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--subtext)]">No contact information available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Contact details */}
      {contactItems.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {contactItems.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <div className={`flex items-center gap-4 px-4 py-4 ${i < contactItems.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-[var(--border)] flex items-center justify-center flex-none">
                  <Icon className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-xs text-[var(--subtext)]">{item.label}</span>
                  <span className="text-sm font-medium text-[var(--text)] truncate">
                    {item.value}
                  </span>
                </div>
                {item.href && (
                  <ExternalLink className="w-4 h-4 text-[var(--subtext)] flex-none" />
                )}
              </div>
            );

            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="block active:bg-[var(--border)] transition-colors"
              >
                {content}
              </a>
            ) : (
              <div key={item.label}>{content}</div>
            );
          })}
        </div>
      )}

      {/* Socials */}
      {socialItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">
            Socials
          </p>
          <div className="flex gap-3">
            {socialItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] active:scale-95 transition-all flex-1 justify-center ${item.bg}`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
