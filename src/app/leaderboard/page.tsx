/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AsyncState } from "@/components/AsyncState";
import { LeaderboardEntry } from "@/lib/queries";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard?limit=25")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to load leaderboard data.");
        }
        return res.json();
      })
      .then((data) => {
        setEntries(data.leaderboard ?? []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const maxConnections = entries && entries.length > 0 ? entries[0].connections : 1;

  return (
    <div className="container-narrow">
      {/* Header */}
      <div className="mb-8 max-w-2xl">
        <div className="eyebrow-mono text-[#7d8187] mb-3">
          {"// DEGREE CENTRALITY RANKING"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-white mb-3 tracking-[-0.03em] leading-tight">
          Most-Connected Maintainers
        </h1>
        <p className="text-[#dadbdf] text-sm leading-relaxed font-normal">
          Contributors ranked by unique co-authors shared across all 25 core open-source repositories in the connection graph.
        </p>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        data={entries}
        emptyMessage="No leaderboard data available."
      >
        {(list) => (
          <div className="space-y-8">
            {/* Top 3 Podium Cards */}
            {list.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                <PodiumCard rank={1} title="Centrality Leader" person={list[0]} badgeText="76 Co-Authors" />
                <PodiumCard rank={2} title="Network Core" person={list[1]} badgeText="74 Co-Authors" />
                <PodiumCard rank={3} title="Network Core" person={list[2]} badgeText="66 Co-Authors" />
              </div>
            )}

            {/* Complete Rankings Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between card-xai px-5 py-3.5 border border-[#212327]">
                <h2 className="eyebrow-mono text-white text-xs">
                  {"// COMPLETE NETWORK CENTRALITY RANKS (TOP 25)"}
                </h2>
                <div className="text-xs text-[#7d8187] font-mono">
                  METRIC: UNIQUE CO-AUTHORSHIPS
                </div>
              </div>

              {list.map((person, index) => {
                const percent = Math.round((person.connections / maxConnections) * 100);
                return (
                  <div
                    key={person.login}
                    className="card-xai p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#212327]"
                  >
                    {/* Left: Rank, Avatar & Info */}
                    <div className="flex items-center gap-3.5 min-w-0 sm:w-2/5">
                      <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center font-mono text-xs text-white flex-shrink-0 bg-[#1a1c20]">
                        #{index + 1}
                      </div>

                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/person/${person.login}`}
                          className="font-normal text-sm text-white hover:underline block truncate"
                        >
                          {person.name}
                        </Link>
                        <div className="text-xs text-[#7d8187] font-mono truncate">
                          @{person.login} {person.company ? `· ${person.company}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Center: Centrality Score Bar */}
                    <div className="flex-1 max-w-xs w-full">
                      <div className="flex justify-between items-center text-[10px] font-mono text-[#7d8187] mb-1">
                        <span>CENTRALITY</span>
                        <span className="text-white font-normal">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#1a1c20] rounded-full h-1.5 overflow-hidden border border-[#212327]">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Right: Metrics & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#212327]">
                      <div className="text-left sm:text-right font-mono">
                        <div className="text-sm font-normal text-white">
                          {person.connections}
                        </div>
                        <div className="text-[10px] text-[#7d8187] uppercase tracking-widest">
                          CO-AUTHORS
                        </div>
                      </div>

                      <Link href={`/person/${person.login}`} className="btn-xai-outline !py-1 !px-3.5 text-xs font-mono">
                        PROFILE
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AsyncState>
    </div>
  );
}

function PodiumCard({
  rank,
  title,
  person,
  badgeText,
}: {
  rank: number;
  title: string;
  person: LeaderboardEntry;
  badgeText: string;
}) {
  return (
    <div className="card-xai p-6 border border-[#212327] flex flex-col items-center justify-between text-center relative overflow-hidden">
      {/* Rank Badge Header */}
      <div className="btn-xai-outline !py-1 !px-3 text-xs font-mono mb-4 flex items-center gap-1.5 text-white">
        <span>#{rank} RANK</span>
        <span>·</span>
        <span>{badgeText}</span>
      </div>

      {/* Maintainer Avatar */}
      <div className="relative mb-4">
        <img
          src={person.avatarUrl}
          alt={person.name}
          className="w-20 h-20 rounded-full border border-white/30 object-cover"
        />
      </div>

      {/* Name & Username */}
      <div className="mb-4 w-full">
        <Link
          href={`/person/${person.login}`}
          className="font-normal text-lg text-white hover:underline truncate block"
        >
          {person.name}
        </Link>
        <div className="text-xs text-[#7d8187] font-mono truncate">
          @{person.login} · <span className="font-sans text-[#dadbdf]">{title}</span>
        </div>
      </div>

      {/* Metric Box */}
      <div className="w-full bg-[#1a1c20] rounded-md p-3 border border-[#212327] mb-4">
        <div className="text-2xl font-normal text-white font-mono mb-0.5">
          {person.connections}
        </div>
        <div className="eyebrow-mono text-[10px] text-[#7d8187]">
          DIRECT CO-AUTHORS
        </div>
      </div>

      {/* Action Button */}
      <Link href={`/person/${person.login}`} className="btn-xai-outline !py-1.5 text-xs font-mono w-full text-center">
        EXPLORE NETWORK
      </Link>
    </div>
  );
}
