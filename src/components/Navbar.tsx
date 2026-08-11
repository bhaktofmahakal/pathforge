"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/path", label: "Path Finder" },
  { href: "/connect", label: "Connectors" },
  { href: "/recommend", label: "Recommendations" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/90 backdrop-blur-xl">
      <div className="container-narrow flex items-center justify-between h-16">
        {/* Left: Brand Logo Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <svg className="w-4 h-4 text-[#22d3ee]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="6" cy="6" r="2.5" className="fill-[#22d3ee] stroke-[#08090d]" strokeWidth="1.5" />
              <circle cx="18" cy="6" r="2.5" className="fill-[#22d3ee] stroke-[#08090d]" strokeWidth="1.5" />
              <circle cx="12" cy="18" r="2.5" className="fill-[#34d399] stroke-[#08090d]" strokeWidth="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.2 7.2l7.6 0M7.5 8.2l3.3 7.6M16.5 8.2l-3.3 7.6" className="stroke-[#22d3ee]/80" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-base group-hover:text-[#22d3ee] transition-colors leading-none">
              PathForge
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
              CognoDB Intelligence
            </span>
          </div>
        </Link>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/50 shadow-[0_0_12px_rgba(34,211,238,0.2)] font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: Clean GitHub Link */}
        <a
          href="https://github.com/bhaktofmahakal/pathforge"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-mono tracking-wider text-slate-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/20 hover:border-white/40 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>GITHUB</span>
        </a>
      </div>
    </nav>
  );
}
