import type { Metadata, Viewport } from "next";
import { Lora, Nunito } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ConditionalMobileChrome } from "@/components/layout/ConditionalMobileChrome";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bayut — Melbourne Shia Islamic Hub",
  description:
    "Connecting Melbourne's Shia Muslim community to Islamic centres, events, prayer times, and ibadah tools.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/bayut-favicon-light.svg", media: "(prefers-color-scheme: light)" },
    { rel: "icon", url: "/bayut-favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#070D1F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${lora.variable} ${nunito.variable}`}>
      <body className="font-[var(--font-nunito)] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ConditionalMobileChrome />
          <SpeedInsights />
          <main className="min-h-screen pt-14 pb-20 max-w-lg mx-auto px-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
