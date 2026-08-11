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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#08090d] text-white font-[family-name:var(--font-inter)]">
        <DbStatusBanner />
        <Navbar />
        <main className="flex-1 pt-12 sm:pt-16 pb-16">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
          PathForge · Built with CognoDB &amp; Next.js
        </footer>
      </body>
    </html>
  );
}
