/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AsyncState } from "@/components/AsyncState";
import { GraphPathResult } from "@/lib/queries";

const QUICK_PATHS = [
  { from: "antfu", to: "jridgewell", label: "Anthony Fu ➔ Justin Ridgewell" },
  { from: "timneutkens", to: "sokra", label: "Tim Neutkens ➔ Tobias Koppers" },
  { from: "eps1lon", to: "gaearon", label: "Sebastian Silbermann ➔ Dan Abramov" },
];

export default function PathPage() {
  return (
    <Suspense fallback={<div className="container-narrow py-12 text-center text-slate-400 text-sm font-mono">Loading path finder…</div>}>
      <PathFinderContent />
    </Suspense>
  );
}

function PathFinderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFrom = searchParams.get("from") || "antfu";
  const initialTo = searchParams.get("to") || "jridgewell";

  const [fromInput, setFromInput] = useState(initialFrom);
  const [toInput, setToInput] = useState(initialTo);

  const [fromQuery, setFromQuery] = useState(initialFrom);
  const [toQuery, setToQuery] = useState(initialTo);

  const [pathData, setPathData] = useState<GraphPathResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPath = async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setFromQuery(from);
    setToQuery(to);

    try {
      const res = await fetch(
        `/api/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) {
        throw new Error("Unable to calculate connection path. Please try again.");
      }
      const data = await res.json();
      if (data.found === false) {
        setPathData(null);
      } else {
        setPathData(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const f = searchParams.get("from") || "antfu";
    const t = searchParams.get("to") || "jridgewell";
    setFromInput(f);
    setToInput(t);
    fetchPath(f, t);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromInput.trim() && toInput.trim()) {
      router.push(
        `/path?from=${encodeURIComponent(fromInput.trim())}&to=${encodeURIComponent(
          toInput.trim()
        )}`
      );
    }
  };

  const handleShortcut = (from: string, to: string) => {
    setFromInput(from);
    setToInput(to);
    router.push(`/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  };

  return (
    <div className="container-narrow">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 text-xs font-mono tracking-widest text-[#22d3ee] uppercase mb-4 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <span>CONNECTION PATH TRAVERSAL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight leading-none">
          Shortest Path Finder
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
          Traverse up to 6 hops connecting any two open-source maintainers via shared repository co-authorships.
        </p>
      </div>

      {/* Traversal Form */}
      <div className="card-cognodb p-6 sm:p-7 mb-8 border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                START CONTRIBUTOR
              </label>
              <input
                type="text"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                placeholder="e.g. antfu"
                className="input-cognodb font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                TARGET CONTRIBUTOR
              </label>
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="e.g. jridgewell"
                className="input-cognodb font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">QUICK PATHS:</span>
              {QUICK_PATHS.map((p) => (
                <button
                  key={`${p.from}-${p.to}`}
                  type="button"
                  onClick={() => handleShortcut(p.from, p.to)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#22d3ee]/15 border border-white/15 hover:border-[#22d3ee]/50 text-xs text-slate-300 hover:text-[#22d3ee] font-mono transition-all shadow-sm"
                >
                  @{p.from} ➔ @{p.to}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-mint !rounded-full !px-5 !py-2 flex-shrink-0 shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-mono text-xs tracking-wider uppercase">TRAVERSE GRAPH</span>
            </button>
          </div>
        </form>
      </div>

      {/* Path Results */}
      {hasSearched && (
        <AsyncState
          isLoading={isLoading}
          error={error}
          data={pathData}
          emptyMessage={`No connection path found between '${fromQuery}' and '${toQuery}' within 6 hops.`}
        >
          {(result) => (
            <div className="space-y-6">
              {/* Summary Bar */}
              <div className="card-cognodb p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[#22d3ee]/40 shadow-xl">
                <div>
                  <div className="text-[10px] text-[#22d3ee] font-mono uppercase tracking-widest font-bold mb-1">
                    PATH FOUND · OPENCYPHER GRAPH TRAVERSAL
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    Connected in {result.hops} {result.hops === 1 ? "hop" : "hops"} ({result.nodes.length} maintainers)
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                  <span className="px-3 py-1 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/30 font-bold">
                    @{fromQuery}
                  </span>
                  <span className="text-slate-500">➔</span>
                  <span className="px-3 py-1 rounded-full bg-[#818cf8]/10 text-[#818cf8] border border-[#818cf8]/30 font-bold">
                    @{toQuery}
                  </span>
                </div>
              </div>

              {/* Workflow Connector Canvas */}
              <div className="card-cognodb p-7 bg-mesh-grid border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee] animate-pulse" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                      WORKFLOW NODE PIPELINE
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.nodes.length} Connected Nodes
                  </span>
                </div>

                {/* Horizontal Scrollable Node Chain */}
                <div className="overflow-x-auto no-scrollbar py-2">
                  <div className="flex items-center min-w-max gap-4 sm:gap-6">
                    {result.nodes.map((node, i) => {
                      const isFirst = i === 0;
                      const isLast = i === result.nodes.length - 1;
                      const segment = result.pathSegments[i];

                      return (
                        <div key={node.login} className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                          {/* Node Card */}
                          <Link
                            href={`/person/${node.login}`}
                            className={`w-64 card-cognodb p-4.5 flex items-center gap-3.5 group transition-all hover:scale-[1.02] flex-shrink-0 border ${
                              isFirst
                                ? "border-[#22d3ee]/60 bg-[#22d3ee]/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                                : isLast
                                ? "border-[#818cf8]/60 bg-[#818cf8]/10 shadow-[0_0_20px_rgba(129,140,248,0.15)]"
                                : "border-white/10 hover:border-[#34d399]/50 bg-[#0d0e15]"
                            }`}
                          >
                            {/* Accent Indicator */}
                            <div
                              className={`w-1.5 h-11 rounded-full flex-shrink-0 ${
                                isFirst
                                  ? "bg-[#22d3ee]"
                                  : isLast
                                  ? "bg-[#818cf8]"
                                  : "bg-[#34d399]"
                              }`}
                            />

                            <img
                              src={node.avatarUrl}
                              alt={node.name}
                              className="w-11 h-11 rounded-full border border-white/20 object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#22d3ee] transition-colors">
                                {node.name}
                              </div>
                              <div className="text-[11px] text-[#22d3ee] font-mono truncate">
                                @{node.login}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 flex-shrink-0">
                              #{i + 1}
                            </span>
                          </Link>

                          {/* Connector Arrow & Shared Repo Badge */}
                          {!isLast && segment && (
                            <div className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 text-center px-2">
                              <div className="px-2.5 py-0.5 rounded-full bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/30 text-[11px] font-mono shadow-sm">
                                {segment.sharedRepos} shared {segment.sharedRepos === 1 ? "repo" : "repos"}
                              </div>
                              <div className="text-[#22d3ee] font-mono font-bold text-xl flex items-center gap-1">
                                <span className="text-slate-600">──</span>
                                <span>➔</span>
                                <span className="text-slate-600">──</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step Breakdown Table */}
              <div className="card-cognodb p-6 border border-white/10 shadow-xl">
                <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-300">STEP-BY-STEP PATH BREAKDOWN</span>
                  <span className="text-xs font-mono text-slate-500">({result.pathSegments.length} segments)</span>
                </h3>

                <div className="space-y-2.5">
                  {result.pathSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#22d3ee]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] text-xs font-mono font-bold flex items-center justify-center border border-[#22d3ee]/30 flex-shrink-0">
                          {index + 1}
                        </span>
                        <Link
                          href={`/person/${segment.from.login}`}
                          className="font-bold text-xs sm:text-sm text-white hover:text-[#22d3ee] transition-colors truncate"
                        >
                          {segment.from.name} <span className="text-slate-500 font-mono">(@{segment.from.login})</span>
                        </Link>
                      </div>

                      <div className="text-[11px] text-[#34d399] font-mono bg-[#34d399]/10 border border-[#34d399]/30 px-3 py-1 rounded-full whitespace-nowrap self-center sm:self-auto">
                        {segment.sharedRepos} shared {segment.sharedRepos === 1 ? "repo" : "repos"}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/person/${segment.to.login}`}
                          className="font-bold text-xs sm:text-sm text-white hover:text-[#22d3ee] transition-colors truncate"
                        >
                          {segment.to.name} <span className="text-slate-500 font-mono">(@{segment.to.login})</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AsyncState>
      )}
    </div>
  );
}
