/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AsyncState } from "@/components/AsyncState";
import { ConnectorResult } from "@/lib/queries";

const QUICK_CONNECTS = [
  { me: "antfu", target: "jridgewell", label: "Anthony Fu ➔ Justin Ridgewell" },
  { me: "gaearon", target: "jridgewell", label: "Dan Abramov ➔ Justin Ridgewell" },
  { me: "timneutkens", target: "jridgewell", label: "Tim Neutkens ➔ Justin Ridgewell" },
];

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="container-narrow text-center text-slate-400 text-sm font-mono py-12">Loading connector finder…</div>}>
      <ConnectContent />
    </Suspense>
  );
}

function ConnectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMe = searchParams.get("me") || "gaearon";
  const initialTarget = searchParams.get("target") || "jridgewell";

  const [meInput, setMeInput] = useState(initialMe);
  const [targetInput, setTargetInput] = useState(initialTarget);

  const [meQuery, setMeQuery] = useState(initialMe);
  const [targetQuery, setTargetQuery] = useState(initialTarget);

  const [connectors, setConnectors] = useState<ConnectorResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = async (me: string, target: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setMeQuery(me);
    setTargetQuery(target);

    try {
      const res = await fetch(
        `/api/connectors?me=${encodeURIComponent(me)}&target=${encodeURIComponent(target)}`
      );
      if (!res.ok) {
        throw new Error("Unable to fetch bridge connectors. Please try again.");
      }
      const data = await res.json();
      setConnectors(data.connectors ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const me = searchParams.get("me") || "gaearon";
    const target = searchParams.get("target") || "jridgewell";
    setMeInput(me);
    setTargetInput(target);
    fetchConnectors(me, target);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meInput.trim() && targetInput.trim()) {
      router.push(
        `/connect?me=${encodeURIComponent(meInput.trim())}&target=${encodeURIComponent(
          targetInput.trim()
        )}`
      );
    }
  };

  const handleShortcut = (me: string, target: string) => {
    setMeInput(me);
    setTargetInput(target);
    router.push(`/connect?me=${encodeURIComponent(me)}&target=${encodeURIComponent(target)}`);
  };

  return (
    <div className="container-narrow">
      {/* Header */}
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 text-xs font-mono tracking-widest text-[#22d3ee] uppercase mb-4 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <span>MUTUAL CONNECTIONS GRAPH</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight leading-none">
          Bridge Connectors
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
          Find 2-hop mutual collaborators who can introduce you to any target maintainer in the open-source graph.
        </p>
      </div>

      {/* Input Form */}
      <div className="card-cognodb p-6 sm:p-7 mb-8 border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                YOUR USERNAME
              </label>
              <input
                type="text"
                value={meInput}
                onChange={(e) => setMeInput(e.target.value)}
                placeholder="e.g. gaearon"
                className="input-cognodb font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                TARGET CONTRIBUTOR YOU WANT TO REACH
              </label>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="e.g. jridgewell"
                className="input-cognodb font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">SHORTCUTS:</span>
              {QUICK_CONNECTS.map((c) => (
                <button
                  key={`${c.me}-${c.target}`}
                  type="button"
                  onClick={() => handleShortcut(c.me, c.target)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#22d3ee]/15 border border-white/15 hover:border-[#22d3ee]/50 text-xs text-slate-300 hover:text-[#22d3ee] font-mono transition-all shadow-sm"
                >
                  @{c.me} ➔ @{c.target}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-mint !rounded-full !px-5 !py-2 flex-shrink-0 shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-mono text-xs tracking-wider uppercase">FIND MUTUAL CONNECTORS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <AsyncState
          isLoading={isLoading}
          error={error}
          data={connectors}
          emptyMessage={`No mutual bridge connectors found between '${meQuery}' and '${targetQuery}'.`}
        >
          {(list) => (
            <div className="space-y-5">
              <div className="flex items-center justify-between card-cognodb px-5 py-3.5 border border-[#22d3ee]/30">
                <div className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                  FOUND {list.length} MUTUAL BRIDGE {list.length === 1 ? "CONNECTOR" : "CONNECTORS"}
                </div>
                <div className="text-xs text-[#22d3ee] font-mono">
                  @{meQuery} ➔ Mutuals ➔ @{targetQuery}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((connector) => (
                  <div key={connector.login} className="card-cognodb p-5 flex items-center justify-between gap-4 group border border-white/10 shadow-lg hover:border-[#22d3ee]/40">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={connector.avatarUrl}
                        alt={connector.name}
                        className="w-12 h-12 rounded-full border border-white/20 object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/person/${connector.login}`}
                          className="font-bold text-sm text-white hover:text-[#22d3ee] transition-colors block truncate"
                        >
                          {connector.name}
                        </Link>
                        <div className="text-xs text-[#22d3ee] font-mono truncate">
                          @{connector.login}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {connector.followers.toLocaleString()} GitHub followers
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/path?from=${meQuery}&to=${connector.login}`}
                      className="btn-dark-secondary !rounded-full !px-3.5 !py-1.5 text-xs font-mono flex-shrink-0 hover:border-[#22d3ee]"
                    >
                      VIEW PATH
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AsyncState>
      )}
    </div>
  );
}
