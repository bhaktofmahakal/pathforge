/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AsyncState } from "@/components/AsyncState";
import { RecommendationResult } from "@/lib/queries";

const QUICK_MAINTAINERS = [
  { login: "antfu", name: "Anthony Fu" },
  { login: "jridgewell", name: "Justin Ridgewell" },
  { login: "timneutkens", name: "Tim Neutkens" },
  { login: "sokra", name: "Tobias Koppers" },
  { login: "eps1lon", name: "Sebastian Silbermann" },
];

export default function RecommendPage() {
  return (
    <Suspense fallback={<div className="container-narrow py-12 text-center text-slate-400 text-sm font-mono">Loading recommendations…</div>}>
      <RecommendContent />
    </Suspense>
  );
}

function RecommendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLogin = searchParams.get("login") || "eps1lon";
  const [loginInput, setLoginInput] = useState(initialLogin);
  const [loginQuery, setLoginQuery] = useState(initialLogin);

  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (login: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setLoginQuery(login);

    try {
      const res = await fetch(`/api/recommend?login=${encodeURIComponent(login)}`);
      if (!res.ok) {
        throw new Error("Unable to fetch repo recommendations. Please try again.");
      }
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const login = searchParams.get("login") || "eps1lon";
    setLoginInput(login);
    fetchRecommendations(login);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      router.push(`/recommend?login=${encodeURIComponent(loginInput.trim())}`);
    }
  };

  const handleShortcut = (login: string) => {
    setLoginInput(login);
    router.push(`/recommend?login=${encodeURIComponent(login)}`);
  };

  return (
    <div className="container-narrow">
      {/* Header */}
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 text-xs font-mono tracking-widest text-[#22d3ee] uppercase mb-4 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <span>GRAPH TOPOLOGY RECOMMENDATION</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight leading-none">
          Repo Recommendations
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
          Discover open-source repositories recommended based on the 1..2 hop network collaboration graph around you.
        </p>
      </div>

      {/* Input Form */}
      <div className="card-cognodb p-6 sm:p-7 mb-8 max-w-xl border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
              CONTRIBUTOR USERNAME
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. eps1lon"
              className="input-cognodb font-mono text-sm"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">SHORTCUTS:</span>
              {QUICK_MAINTAINERS.map((m) => (
                <button
                  key={m.login}
                  type="button"
                  onClick={() => handleShortcut(m.login)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#22d3ee]/15 border border-white/15 hover:border-[#22d3ee]/50 text-xs text-slate-300 hover:text-[#22d3ee] font-mono transition-all shadow-sm"
                >
                  @{m.login}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-mint !rounded-full !px-5 !py-2 flex-shrink-0 shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-mono text-xs tracking-wider uppercase">GET RECOMMENDATIONS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <AsyncState
          isLoading={isLoading}
          error={error}
          data={recommendations}
          emptyMessage={`No repository recommendations found for '${loginQuery}'.`}
        >
          {(list) => (
            <div className="space-y-5">
              <div className="flex items-center justify-between card-cognodb px-5 py-3.5 border border-[#22d3ee]/30">
                <div className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                  RECOMMENDED REPOSITORIES FOR @{loginQuery} ({list.length})
                </div>
                <div className="text-xs text-[#22d3ee] font-mono">
                  Network Path Depth: 1..2 hops
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((repo) => (
                  <div key={repo.fullName} className="card-cognodb p-6 flex flex-col justify-between group border border-white/10 shadow-lg hover:border-[#22d3ee]/40">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white hover:text-[#22d3ee] transition-colors text-sm sm:text-base break-all"
                        >
                          {repo.fullName}
                        </a>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/30 uppercase">
                          {repo.primaryLanguage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-normal">
                        {repo.description || "No description available."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3.5 mt-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                        <svg className="w-3.5 h-3.5 fill-amber-300" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stars.toLocaleString()} stars
                      </span>
                      <span className="text-[#22d3ee] font-mono font-bold">
                        Network Strength: {repo.strength}
                      </span>
                    </div>
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
