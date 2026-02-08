import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://callguide.jp"),
  title: {
    default: "Call Guide - アイドルコール・MIX共有サイト",
    template: "%s | Call Guide",
  },
  description: "アイドルのライブで使われるコール、MIX、口上をセットリストに合わせて共有・検索できるプラットフォームです。",
  icons: {
    icon: [{ url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Call Guide - アイドルコール・MIX共有サイト",
    description: "アイドルのライブで使われるコール、MIX、口上をセットリストに合わせて共有・検索できるプラットフォームです。",
    siteName: "Call Guide",
    locale: "ja_JP",
    type: "website",
  },
  manifest: "/manifest.json?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Call Guide",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.variable} antialiased bg-black text-zinc-50`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
