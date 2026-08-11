/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PersonSuggestion {
  login: string;
  name: string;
  avatarUrl: string;
}

const FEATURED_CONTRIBUTORS = [
  { login: "antfu", name: "Anthony Fu", role: "Vite / Nuxt" },
  { login: "jridgewell", name: "Justin Ridgewell", role: "Babel / Google" },
  { login: "timneutkens", name: "Tim Neutkens", role: "Next.js / Vercel" },
  { login: "sokra", name: "Tobias Koppers", role: "Webpack / Turbopack" },
  { login: "eps1lon", name: "Sebastian Silbermann", role: "React Core" },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results ?? []);
        }
      } catch {
        /* silent proceed */
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (login: string) => {
    setShowSuggestions(false);
    router.push(`/person/${login}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/person/${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col justify-center px-4 py-12 bg-mesh-grid">
      {/* Hero Header */}
      <div className="text-center mb-10 max-w-4xl mx-auto">
        <div className="badge-mint mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse" />
          Graph Intelligence Platform
        </div>

        <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight mb-4 leading-tight text-white">
          Open-Source Contributor{" "}
          <span className="bg-gradient-to-r from-[#00f2fe] via-[#38ef7d] to-[#6366f1] bg-clip-text text-transparent">
            Connection Graph
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Map multi-hop collaboration paths across 620+ open-source maintainers and 25 core repositories.
          Identify bridge contributors, degree centrality leaders, and network repo recommendations.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative mb-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search maintainer by username (e.g. antfu, jridgewell)..."
            className="input-cognodb pl-11 pr-11 py-3.5 text-sm"
            autoFocus
          />

          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="loading-spinner-mint !w-4 !h-4" />
            </div>
          )}
        </div>

        {/* Typeahead Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full card-cognodb overflow-hidden z-50 border-[#00f2fe]/40">
            {suggestions.map((person) => (
              <button
                key={person.login}
                type="button"
                onClick={() => handleSelect(person.login)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <img src={person.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                <div>
                  <div className="text-sm font-semibold text-white">{person.name}</div>
                  <div className="text-xs text-slate-400 font-mono">@{person.login}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Featured Contributor Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-3xl mx-auto">
        <span className="text-xs text-slate-500 font-medium mr-1">Maintainer Shortcuts:</span>
        {FEATURED_CONTRIBUTORS.map((c) => (
          <button
            key={c.login}
            onClick={() => router.push(`/person/${c.login}`)}
            className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#00f2fe]/10 border border-white/10 hover:border-[#00f2fe]/40 text-xs text-slate-300 hover:text-[#00f2fe] transition-all flex items-center gap-1.5 font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]" />
            @{c.login}
          </button>
        ))}
      </div>

      {/* Feature Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mx-auto mb-12">
        <FeatureCard
          title="Shortest Path Finder"
          description="Traverse up to 6 hops connecting any two maintainers via shared co-authorships"
          href="/path?from=antfu&to=jridgewell"
          badgeText="Graph Traversal"
          iconPath="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />

        <FeatureCard
          title="Bridge Connectors"
          description="Discover 2-hop mutual collaborators who can introduce you to a maintainer"
          href="/connect?me=timneutkens&target=eps1lon"
          badgeText="Mutual Network"
          iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />

        <FeatureCard
          title="Repo Recommendations"
          description="Get personalized repository recommendations based on network graph topology"
          href="/recommend?login=antfu"
          badgeText="Graph Traversal"
          iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.194.137l-1.636.728A2 2 0 001.5 17.828v1.172A2 2 0 003.5 21h17a2 2 0 002-2v-1.172a2 2 0 00-1.272-1.856l-1.8-1.544z"
        />
      </div>

      {/* CognoDB Telemetry Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mx-auto">
        <StatCard value="649" label="Nodes" sublabel="25 Repos · 624 People" color="text-white" />
        <StatCard value="9,539" label="Relationships" sublabel="8.8k Co-Authorships" color="text-[#00f2fe]" />
        <StatCard value="129 MB" label="Storage Used" sublabel="CognoDB Cloud Free" color="text-[#38ef7d]" />
        <StatCard value="0.20ms" label="Avg Query Latency" sublabel="Bolt Protocol" color="text-[#818cf8]" />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  badgeText,
  iconPath,
}: {
  title: string;
  description: string;
  href: string;
  badgeText: string;
  iconPath: string;
}) {
  return (
    <Link href={href} className="card-cognodb p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center text-[#00f2fe] group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={iconPath} />
            </svg>
          </div>
          <span className="badge-mint !text-[10px]">{badgeText}</span>
        </div>

        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-[#00f2fe] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-normal">{description}</p>
      </div>

      <div className="flex items-center gap-1 text-xs text-[#00f2fe] font-bold mt-5 group-hover:translate-x-1 transition-transform">
        <span>Explore Graph</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </Link>
  );
}

function StatCard({
  value,
  label,
  sublabel,
  color,
}: {
  value: string;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="card-cognodb p-4 text-center">
      <div className={`text-2xl font-black ${color} tracking-tight font-mono mb-0.5`}>{value}</div>
      <div className="text-xs font-bold text-slate-200">{label}</div>
      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sublabel}</div>
    </div>
  );
}
