import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DbStatusBanner } from "@/components/DbStatusBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PathForge — OSS Contributor Connection Graph",
  description:
    "Discover how open-source contributors are connected through the repos they've worked on. Find paths, bridge people, and get repo recommendations.",
  keywords: ["open source", "github", "graph database", "connections", "contributors"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-inter)]">
        <DbStatusBanner />
        <Navbar />
        <main className="flex-1 pt-8 sm:pt-12 pb-16">{children}</main>
        <footer className="border-t border-[#212327] py-8 text-center text-xs text-[#7d8187] font-mono">
          PathForge · Powered by CognoDB Cloud &amp; Next.js 16
        </footer>
      </body>
    </html>
  );
}
