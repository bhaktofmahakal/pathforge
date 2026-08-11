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
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-12">
      {/* Hero Header */}
      <div className="text-center mb-12 max-w-4xl mx-auto">
        <div className="eyebrow-mono mb-4 text-[#7d8187]">
          {"// GRAPH INTELLIGENCE ENGINE"}
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.03em] mb-6 leading-tight text-white">
          Open-Source Contributor Connection Graph
        </h1>

        <p className="text-[#dadbdf] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Traverse multi-hop collaboration paths across 620+ open-source maintainers and 25 core repositories. Powered by CognoDB Cloud.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search maintainer by handle (e.g. antfu, jridgewell)..."
            className="input-xai py-4 px-5 text-base font-normal tracking-tight"
            autoFocus
          />

          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="loading-spinner-white" />
            </div>
          )}
        </div>

        {/* Typeahead Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full card-xai overflow-hidden z-50 border-[#212327]">
            {suggestions.map((person) => (
              <button
                key={person.login}
                type="button"
                onClick={() => handleSelect(person.login)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1c20] transition-colors text-left border-b border-[#212327] last:border-0"
              >
                <img src={person.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                <div>
                  <div className="text-sm font-normal text-white">{person.name}</div>
                  <div className="text-xs text-[#7d8187] font-mono">@{person.login}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Featured Contributor Chips (xAI Outline Pills) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-14 max-w-3xl mx-auto">
        <span className="eyebrow-mono text-[11px] text-[#7d8187] mr-1">{"// SHORTCUTS:"}</span>
        {FEATURED_CONTRIBUTORS.map((c) => (
          <button
            key={c.login}
            onClick={() => router.push(`/person/${c.login}`)}
            className="btn-xai-outline text-xs font-mono tracking-wider !py-1 !px-3.5"
          >
            @{c.login}
          </button>
        ))}
      </div>

      {/* Feature Action Cards (xAI Charcoal Cards with hairline borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full mx-auto mb-14">
        <FeatureCard
          title="Shortest Path Finder"
          description="Traverse up to 6 hops connecting any two maintainers via shared co-authorships"
          href="/path?from=antfu&to=jridgewell"
          eyebrow="// TRAVERSAL"
        />

        <FeatureCard
          title="Bridge Connectors"
          description="Discover 2-hop mutual collaborators who can introduce you to a maintainer"
          href="/connect?me=gaearon&target=jridgewell"
          eyebrow="// CONNECTORS"
        />

        <FeatureCard
          title="Repo Recommendations"
          description="Get personalized repository recommendations based on network graph topology"
          href="/recommend?login=eps1lon"
          eyebrow="// RECOMMENDATIONS"
        />
      </div>

      {/* CognoDB Telemetry Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mx-auto">
        <StatCard value="649" label="GRAPH NODES" sublabel="25 REPOS · 624 PEOPLE" />
        <StatCard value="9,539" label="RELATIONSHIPS" sublabel="8.8K CO-AUTHORSHIPS" />
        <StatCard value="129 MB" label="STORAGE USED" sublabel="COGNODB CLOUD" />
        <StatCard value="0.20ms" label="AVG LATENCY" sublabel="BOLT PROTOCOL" />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  eyebrow,
}: {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
}) {
  return (
    <Link href={href} className="card-xai p-6 flex flex-col justify-between group">
      <div>
        <div className="eyebrow-mono text-[#7d8187] text-[11px] mb-3">{eyebrow}</div>
        <h3 className="text-lg font-normal text-white mb-2 tracking-tight group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-xs text-[#dadbdf] leading-relaxed font-normal">{description}</p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="btn-xai-outline text-xs font-mono !py-1 !px-3 group-hover:border-white">
          EXPLORE ➔
        </span>
      </div>
    </Link>
  );
}

function StatCard({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="card-xai p-5 text-center">
      <div className="text-2xl font-normal text-white tracking-tight font-mono mb-1">{value}</div>
      <div className="eyebrow-mono text-[10px] text-white">{label}</div>
      <div className="text-[10px] text-[#7d8187] font-mono mt-0.5">{sublabel}</div>
    </div>
  );
}
