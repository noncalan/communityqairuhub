import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/providers";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";
import "sonner/dist/styles.css";
import "./globals.css";

// A fresh CSP nonce is forwarded by proxy.ts on every request. Nonces can only
// be attached to framework scripts during dynamic rendering.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getTrustedSiteOrigin()),
  title: { default: "QAIRU Hub", template: "%s · QAIRU Hub" },
  description: "Discover people, communities, projects, events and opportunities across QAIRU.",
  openGraph: {
    title: "QAIRU Hub",
    description: "Everything happening at QAIRU. In one place.",
    type: "website",
    images: [{ url: "/og.png", width: 1744, height: 920, alt: "QAIRU Hub — everything happening at QAIRU in one place" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
