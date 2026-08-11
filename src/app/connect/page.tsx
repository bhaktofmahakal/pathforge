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
    <Suspense fallback={<div className="container-narrow text-center text-[#7d8187] text-sm font-mono">{"// LOADING CONNECTORS..."}</div>}>
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
      <div className="mb-8 max-w-2xl">
        <div className="eyebrow-mono text-[#7d8187] mb-3">
          {"// MUTUAL CONNECTIONS GRAPH"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-white mb-3 tracking-[-0.03em] leading-tight">
          Bridge Connectors
        </h1>
        <p className="text-[#dadbdf] text-sm leading-relaxed font-normal">
          Find 2-hop mutual collaborators who can introduce you to any target maintainer in the open-source graph.
        </p>
      </div>

      {/* Input Form */}
      <div className="card-xai p-6 sm:p-7 mb-8 border border-[#212327]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block eyebrow-mono text-[#7d8187] mb-2 text-[11px]">
                YOUR USERNAME
              </label>
              <input
                type="text"
                value={meInput}
                onChange={(e) => setMeInput(e.target.value)}
                placeholder="e.g. gaearon"
                className="input-xai font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block eyebrow-mono text-[#7d8187] mb-2 text-[11px]">
                TARGET CONTRIBUTOR YOU WANT TO REACH
              </label>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="e.g. jridgewell"
                className="input-xai font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[#212327]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7d8187]">
              <span className="eyebrow-mono text-[10px] text-[#7d8187]">{"// SHORTCUTS:"}</span>
              {QUICK_CONNECTS.map((c) => (
                <button
                  key={`${c.me}-${c.target}`}
                  type="button"
                  onClick={() => handleShortcut(c.me, c.target)}
                  className="btn-xai-outline text-xs font-mono !py-1 !px-3"
                >
                  @{c.me} ➔ @{c.target}
                </button>
              ))}
            </div>

            <button type="submit" className="btn-xai-primary flex-shrink-0">
              <span className="font-mono text-xs tracking-widest uppercase">FIND CONNECTORS</span>
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
              <div className="flex items-center justify-between card-xai px-5 py-3.5 border border-[#212327]">
                <div className="eyebrow-mono text-white text-xs">
                  {`// FOUND ${list.length} MUTUAL BRIDGE ${list.length === 1 ? "CONNECTOR" : "CONNECTORS"}`}
                </div>
                <div className="text-xs text-[#7d8187] font-mono">
                  @{meQuery} ➔ MUTUALS ➔ @{targetQuery}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((connector) => (
                  <div key={connector.login} className="card-xai p-5 flex items-center justify-between gap-4 border border-[#212327]">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={connector.avatarUrl}
                        alt={connector.name}
                        className="w-12 h-12 rounded-full border border-white/20 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/person/${connector.login}`}
                          className="font-normal text-sm text-white hover:underline block truncate"
                        >
                          {connector.name}
                        </Link>
                        <div className="text-xs text-[#7d8187] font-mono truncate">
                          @{connector.login}
                        </div>
                        <div className="text-[11px] text-[#7d8187] font-mono">
                          {connector.followers.toLocaleString()} GitHub followers
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/path?from=${meQuery}&to=${connector.login}`}
                      className="btn-xai-outline !py-1 !px-3 text-xs font-mono flex-shrink-0"
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
