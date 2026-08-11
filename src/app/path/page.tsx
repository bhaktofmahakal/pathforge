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
    <Suspense fallback={<div className="container-narrow py-12 text-center text-[#7d8187] text-sm font-mono">{"// LOADING PATH FINDER..."}</div>}>
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
      <div className="mb-8 max-w-2xl">
        <div className="eyebrow-mono text-[#7d8187] mb-3">
          {"// CONNECTION PATH TRAVERSAL"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-white mb-3 tracking-[-0.03em] leading-tight">
          Shortest Path Finder
        </h1>
        <p className="text-[#dadbdf] text-sm leading-relaxed font-normal">
          Traverse up to 6 hops connecting any two open-source maintainers via shared repository co-authorships.
        </p>
      </div>

      {/* Traversal Form */}
      <div className="card-xai p-6 sm:p-7 mb-8 border border-[#212327]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow-mono text-[#7d8187] mb-2 text-[11px]">
                START CONTRIBUTOR
              </label>
              <input
                type="text"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                placeholder="e.g. antfu"
                className="input-xai font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block eyebrow-mono text-[#7d8187] mb-2 text-[11px]">
                TARGET CONTRIBUTOR
              </label>
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="e.g. jridgewell"
                className="input-xai font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[#212327]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7d8187]">
              <span className="eyebrow-mono text-[10px] text-[#7d8187]">{"// QUICK PATHS:"}</span>
              {QUICK_PATHS.map((p) => (
                <button
                  key={`${p.from}-${p.to}`}
                  type="button"
                  onClick={() => handleShortcut(p.from, p.to)}
                  className="btn-xai-outline text-xs font-mono !py-1 !px-3"
                >
                  @{p.from} ➔ @{p.to}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-xai-primary flex-shrink-0">
              <span className="font-mono text-xs tracking-widest uppercase">TRAVERSE GRAPH</span>
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
              <div className="card-xai p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#212327]">
                <div>
                  <div className="eyebrow-mono text-[#7d8187] text-[10px] mb-1">
                    {"// OPENCYPHER PATH FOUND"}
                  </div>
                  <div className="text-xl sm:text-3xl font-normal text-white tracking-tight">
                    Connected in {result.hops} {result.hops === 1 ? "hop" : "hops"} ({result.nodes.length} maintainers)
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                  <span className="btn-xai-outline text-white border-white/40 !py-1 !px-3 font-normal">
                    @{fromQuery}
                  </span>
                  <span className="text-[#7d8187]">➔</span>
                  <span className="btn-xai-outline text-white border-white/40 !py-1 !px-3 font-normal">
                    @{toQuery}
                  </span>
                </div>
              </div>

              {/* Workflow Connector Canvas */}
              <div className="card-xai p-7 border border-[#212327]">
                <div className="flex items-center justify-between mb-6">
                  <div className="eyebrow-mono text-white text-xs">
                    {"// WORKFLOW NODE PIPELINE"}
                  </div>
                  <span className="text-xs text-[#7d8187] font-mono">
                    {result.nodes.length} CONNECTED NODES
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
                            className={`w-64 card-xai p-4.5 flex items-center gap-3.5 group transition-all flex-shrink-0 ${
                              isFirst || isLast ? "border-white/50 bg-[#1f2127]" : "border-[#212327] bg-[#191919]"
                            }`}
                          >
                            <img
                              src={node.avatarUrl}
                              alt={node.name}
                              className="w-11 h-11 rounded-full border border-white/20 object-cover flex-shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="font-normal text-xs sm:text-sm text-white truncate group-hover:text-white transition-colors">
                                {node.name}
                              </div>
                              <div className="text-[11px] text-[#7d8187] font-mono truncate">
                                @{node.login}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 flex-shrink-0">
                              #{i + 1}
                            </span>
                          </Link>

                          {/* Connector Arrow & Shared Repo Badge */}
                          {!isLast && segment && (
                            <div className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 text-center px-2">
                              <div className="eyebrow-mono text-[10px] text-white border border-white/20 px-2.5 py-0.5 rounded-full bg-[#1a1c20]">
                                {segment.sharedRepos} REPOS
                              </div>
                              <div className="text-white font-mono font-normal text-lg flex items-center gap-1">
                                <span className="text-[#7d8187]">──</span>
                                <span>➔</span>
                                <span className="text-[#7d8187]">──</span>
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
              <div className="card-xai p-6 border border-[#212327]">
                <h3 className="eyebrow-mono text-white text-xs mb-4 flex items-center justify-between">
                  <span>{"// STEP-BY-STEP PATH BREAKDOWN"}</span>
                  <span className="text-[#7d8187]">({result.pathSegments.length} SEGMENTS)</span>
                </h3>

                <div className="space-y-2.5">
                  {result.pathSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-md bg-[#1a1c20] border border-[#212327]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-white/30 text-white text-xs font-mono font-normal flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <Link
                          href={`/person/${segment.from.login}`}
                          className="font-normal text-xs sm:text-sm text-white hover:underline truncate"
                        >
                          {segment.from.name} <span className="text-[#7d8187] font-mono">(@{segment.from.login})</span>
                        </Link>
                      </div>

                      <div className="eyebrow-mono text-[11px] text-white border border-white/20 px-3 py-1 rounded-full bg-[#191919] whitespace-nowrap self-center sm:self-auto">
                        {segment.sharedRepos} SHARED REPOS
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/person/${segment.to.login}`}
                          className="font-normal text-xs sm:text-sm text-white hover:underline truncate"
                        >
                          {segment.to.name} <span className="text-[#7d8187] font-mono">(@{segment.to.login})</span>
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
