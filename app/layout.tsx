import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://call-guide.vercel.app"),
  title: {
    default: "Call Guide",
    template: "%s | Call Guide",
  },
  description: "アイドル・コンカフェのコールガイド共有サイト",
  themeColor: "#000000",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Call Guide",
    description: "アイドル・コンカフェのコールガイド共有サイト",
    siteName: "Call Guide",
    locale: "ja_JP",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Call Guide",
  },
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
