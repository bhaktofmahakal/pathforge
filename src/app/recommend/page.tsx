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
    <Suspense fallback={<div className="container-narrow py-12 text-center text-[#7d8187] text-sm font-mono">{"// LOADING RECOMMENDATIONS..."}</div>}>
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
      <div className="mb-8 max-w-2xl">
        <div className="eyebrow-mono text-[#7d8187] mb-3">
          {"// GRAPH TOPOLOGY RECOMMENDATION"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-white mb-3 tracking-[-0.03em] leading-tight">
          Repo Recommendations
        </h1>
        <p className="text-[#dadbdf] text-sm leading-relaxed font-normal">
          Discover open-source repositories recommended based on the 1..2 hop network collaboration graph around you.
        </p>
      </div>

      {/* Input Form */}
      <div className="card-xai p-6 sm:p-7 mb-8 max-w-xl border border-[#212327]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block eyebrow-mono text-[#7d8187] mb-2 text-[11px]">
              CONTRIBUTOR USERNAME
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. eps1lon"
              className="input-xai font-mono text-sm"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[#212327]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7d8187]">
              <span className="eyebrow-mono text-[10px] text-[#7d8187]">{"// SHORTCUTS:"}</span>
              {QUICK_MAINTAINERS.map((m) => (
                <button
                  key={m.login}
                  type="button"
                  onClick={() => handleShortcut(m.login)}
                  className="btn-xai-outline text-xs font-mono !py-1 !px-3"
                >
                  @{m.login}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-xai-primary flex-shrink-0">
              <span className="font-mono text-xs tracking-widest uppercase">RECOMMEND REPOS</span>
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
              <div className="flex items-center justify-between card-xai px-5 py-3.5 border border-[#212327]">
                <div className="eyebrow-mono text-white text-xs">
                  {`// RECOMMENDED REPOSITORIES FOR @${loginQuery} (${list.length})`}
                </div>
                <div className="text-xs text-[#7d8187] font-mono">
                  DEPTH: 1..2 HOPS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((repo) => (
                  <div key={repo.fullName} className="card-xai p-6 flex flex-col justify-between border border-[#212327]">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-normal text-white hover:underline text-base break-all"
                        >
                          {repo.fullName}
                        </a>
                        <span className="btn-xai-outline !py-0.5 !px-2.5 text-[10px] font-mono uppercase text-[#dadbdf]">
                          {repo.primaryLanguage}
                        </span>
                      </div>

                      <p className="text-xs text-[#dadbdf] line-clamp-2 mb-4 leading-relaxed font-normal">
                        {repo.description || "No description available."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-[#212327] pt-3.5 mt-2">
                      <span className="font-mono text-white text-xs">
                        ★ {repo.stars.toLocaleString()} stars
                      </span>
                      <span className="text-[#7d8187] font-mono text-xs">
                        NETWORK STRENGTH: {repo.strength}
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
