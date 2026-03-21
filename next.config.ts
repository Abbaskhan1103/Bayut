import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years (only effective in production behind HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Basic XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Stripe
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      // Styles: Next.js inlines styles; Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: Supabase storage, YouTube thumbnails, data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com",
      // Fetch/XHR: Supabase API, Stripe, app itself
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      // Iframes: YouTube embeds, Stripe
      "frame-src https://www.youtube.com https://js.stripe.com https://hooks.stripe.com",
      // Media: YouTube streams
      "media-src 'self' https://www.youtube.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
