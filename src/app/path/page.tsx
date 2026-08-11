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
    <Suspense fallback={<div className="container-narrow py-12 text-center text-slate-400 text-sm">Loading path finder…</div>}>
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
        <div className="badge-mint mb-3">Connection Path Flow</div>
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          Shortest Path Finder
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          Traverse up to 6 hops connecting any two open-source maintainers via shared repository co-authorships.
        </p>
      </div>

      {/* Traversal Form */}
      <div className="card-cognodb p-5 sm:p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Start Contributor
              </label>
              <input
                type="text"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                placeholder="e.g. antfu"
                className="input-cognodb"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Target Contributor
              </label>
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="e.g. jridgewell"
                className="input-cognodb"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px]">Quick Paths:</span>
              {QUICK_PATHS.map((p) => (
                <button
                  key={`${p.from}-${p.to}`}
                  type="button"
                  onClick={() => handleShortcut(p.from, p.to)}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-[#00f2fe]/10 border border-white/10 text-[11px] text-slate-300 hover:text-[#00f2fe] font-mono transition-all"
                >
                  @{p.from} ➔ @{p.to}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-mint flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Traverse Graph Network</span>
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
              <div className="card-cognodb p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[#00f2fe]/30">
                <div>
                  <div className="text-[10px] text-[#00f2fe] font-mono uppercase tracking-wider font-bold mb-1">
                    Path Found · OpenCypher Traversal
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white">
                    Connected in {result.hops} {result.hops === 1 ? "hop" : "hops"} ({result.nodes.length} maintainers)
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono">
                  <span className="badge-mint">@{fromQuery}</span>
                  <span className="text-slate-500">➔</span>
                  <span className="badge-indigo">@{toQuery}</span>
                </div>
              </div>

              {/* Spacious Workflow Connector Canvas */}
              <div className="card-cognodb p-6 bg-mesh-grid">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] animate-pulse" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Interactive Connection Pipeline
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.nodes.length} Connected Nodes
                  </span>
                </div>

                {/* Horizontal Scrollable Node Chain (Zero Overlap, Generous Width) */}
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
                            className={`w-64 card-cognodb p-4 flex items-center gap-3.5 group transition-all hover:scale-[1.02] flex-shrink-0 ${
                              isFirst
                                ? "border-[#00f2fe]/60 bg-[#00f2fe]/10 shadow-[0_0_20px_rgba(0,242,254,0.15)]"
                                : isLast
                                ? "border-[#6366f1]/60 bg-[#6366f1]/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                : "border-white/10 hover:border-[#38ef7d]/50 bg-[#0d0e15]"
                            }`}
                          >
                            {/* Color Bar */}
                            <div
                              className={`w-1.5 h-11 rounded-full flex-shrink-0 ${
                                isFirst
                                  ? "bg-[#00f2fe]"
                                  : isLast
                                  ? "bg-[#6366f1]"
                                  : "bg-[#38ef7d]"
                              }`}
                            />

                            <img
                              src={node.avatarUrl}
                              alt={node.name}
                              className="w-11 h-11 rounded-full border border-white/20 object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#00f2fe] transition-colors">
                                {node.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                @{node.login}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 flex-shrink-0">
                              #{i + 1}
                            </span>
                          </Link>

                          {/* Connector Arrow & Shared Repo Badge */}
                          {!isLast && segment && (
                            <div className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 text-center px-2">
                              <div className="badge-emerald !text-[11px] font-mono shadow-sm">
                                {segment.sharedRepos} shared {segment.sharedRepos === 1 ? "repo" : "repos"}
                              </div>
                              <div className="text-[#00f2fe] font-mono font-bold text-xl flex items-center gap-1">
                                <span className="text-slate-500">──</span>
                                <span>➔</span>
                                <span className="text-slate-500">──</span>
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
              <div className="card-cognodb p-5 sm:p-6">
                <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center justify-between">
                  <span>Step-by-Step Path Breakdown</span>
                  <span className="text-xs font-mono text-slate-500">({result.pathSegments.length} segments)</span>
                </h3>

                <div className="space-y-2.5">
                  {result.pathSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#00f2fe]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#00f2fe]/10 text-[#00f2fe] text-xs font-mono font-bold flex items-center justify-center border border-[#00f2fe]/20 flex-shrink-0">
                          {index + 1}
                        </span>
                        <Link
                          href={`/person/${segment.from.login}`}
                          className="font-bold text-xs sm:text-sm text-white hover:text-[#00f2fe] transition-colors truncate"
                        >
                          {segment.from.name} <span className="text-slate-500 font-mono">(@{segment.from.login})</span>
                        </Link>
                      </div>

                      <div className="text-[11px] text-[#38ef7d] font-mono bg-[#38ef7d]/10 border border-[#38ef7d]/20 px-3 py-0.5 rounded-md whitespace-nowrap self-center sm:self-auto">
                        {segment.sharedRepos} shared {segment.sharedRepos === 1 ? "repo" : "repos"}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/person/${segment.to.login}`}
                          className="font-bold text-xs sm:text-sm text-white hover:text-[#00f2fe] transition-colors truncate"
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
