import type { Metadata, Viewport } from "next";

import { PageTransition } from "@/components/navigation/page-transition";
import { MobileSwipeNavigation } from "@/components/navigation/mobile-swipe-navigation";
import { TopNav } from "@/components/navigation/top-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sistema Floratta",
    template: "%s | Sistema Floratta",
  },
  description:
    "Sistema de varejo mobile-first para catálogo, estoque e vendas da Floratta.",
  applicationName: "Sistema Floratta",
  icons: {
    shortcut: "/logo_pequeno.svg",
    icon: [
      { url: "/logo_pequeno.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#6a1f46",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(245,185,204,0.42),_transparent_34%),linear-gradient(160deg,_#fffaf6_0%,_#f6efe9_44%,_#f2e7f0_100%)] text-zinc-900">
        <div className="relative min-h-screen overflow-x-clip">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_72%)]" />
          <div className="relative flex min-h-screen flex-col">
            <MobileSwipeNavigation />
            <TopNav />
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
