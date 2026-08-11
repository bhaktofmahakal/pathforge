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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 text-xs font-mono tracking-widest text-[#22d3ee] uppercase mb-4 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <span>DEGREE CENTRALITY RANKING</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight leading-none">
          Most-Connected Maintainers
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
          Contributors ranked by the volume of unique co-authors they share across all 25 core open-source repositories in the connection graph.
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
                <PodiumCard
                  rank={1}
                  title="Rank #1 · Centrality Leader"
                  person={list[0]}
                  accentBg="bg-gradient-to-b from-amber-400/10 to-transparent"
                  borderColor="border-amber-400/50 hover:border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                  ringColor="border-amber-400"
                  rankTag="bg-amber-400/15 text-amber-300 border-amber-400/40"
                  badgeText="76 Direct Co-Authors"
                />
                <PodiumCard
                  rank={2}
                  title="Rank #2 · Network Core"
                  person={list[1]}
                  accentBg="bg-gradient-to-b from-slate-300/10 to-transparent"
                  borderColor="border-slate-300/40 hover:border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.1)]"
                  ringColor="border-slate-300"
                  rankTag="bg-slate-300/15 text-slate-200 border-slate-300/40"
                  badgeText="74 Direct Co-Authors"
                />
                <PodiumCard
                  rank={3}
                  title="Rank #3 · Network Core"
                  person={list[2]}
                  accentBg="bg-gradient-to-b from-amber-600/10 to-transparent"
                  borderColor="border-amber-600/40 hover:border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.1)]"
                  ringColor="border-amber-600"
                  rankTag="bg-amber-600/15 text-amber-400 border-amber-600/40"
                  badgeText="66 Direct Co-Authors"
                />
              </div>
            )}

            {/* Complete Rankings Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between card-cognodb px-5 py-3.5 border border-[#22d3ee]/30">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                  COMPLETE NETWORK CENTRALITY RANKS (TOP 25)
                </h2>
                <div className="text-xs text-[#22d3ee] font-mono">
                  Metric: Unique Co-Authorships
                </div>
              </div>

              {list.map((person, index) => {
                const percent = Math.round((person.connections / maxConnections) * 100);
                return (
                  <div
                    key={person.login}
                    className="card-cognodb p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group border border-white/10 hover:border-[#22d3ee]/40 shadow-md"
                  >
                    {/* Left: Rank, Avatar & Info */}
                    <div className="flex items-center gap-3.5 min-w-0 sm:w-2/5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border font-mono ${
                          index === 0
                            ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                            : index === 1
                            ? "bg-slate-300/20 text-slate-200 border-slate-300/40"
                            : index === 2
                            ? "bg-amber-600/20 text-amber-400 border-amber-600/40"
                            : "bg-white/5 text-slate-400 border-white/10"
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0 group-hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/person/${person.login}`}
                          className="font-bold text-sm text-white hover:text-[#22d3ee] transition-colors block truncate"
                        >
                          {person.name}
                        </Link>
                        <div className="text-xs text-[#22d3ee] font-mono truncate">
                          @{person.login} {person.company ? `· ${person.company}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Center: Centrality Score Bar */}
                    <div className="flex-1 max-w-xs w-full">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                        <span>CENTRALITY RATING</span>
                        <span className="text-[#22d3ee] font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-[#22d3ee] to-[#34d399] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Right: Metrics & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                      <div className="text-left sm:text-right font-mono">
                        <div className="text-sm font-bold text-[#22d3ee]">
                          {person.connections}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                          CO-AUTHORS
                        </div>
                      </div>

                      <Link href={`/person/${person.login}`} className="btn-dark-secondary !rounded-full !px-4 !py-1.5 text-xs font-mono">
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
  accentBg,
  borderColor,
  ringColor,
  rankTag,
  badgeText,
}: {
  rank: number;
  title: string;
  person: LeaderboardEntry;
  accentBg: string;
  borderColor: string;
  ringColor: string;
  rankTag: string;
  badgeText: string;
}) {
  return (
    <div className={`card-cognodb p-6 border ${borderColor} ${accentBg} flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-xl`}>
      {/* Rank Badge Header */}
      <div className={`px-3.5 py-1 rounded-full text-xs font-bold font-mono border ${rankTag} mb-4 flex items-center gap-1.5`}>
        <span>#{rank} {rankTag.includes("amber-400") ? "Gold" : rankTag.includes("slate") ? "Silver" : "Bronze"}</span>
        <span>·</span>
        <span>{badgeText}</span>
      </div>

      {/* Maintainer Avatar with Ring */}
      <div className="relative mb-4">
        <img
          src={person.avatarUrl}
          alt={person.name}
          className={`w-20 h-20 rounded-full border-2 ${ringColor} object-cover group-hover:scale-105 transition-transform shadow-lg`}
        />
      </div>

      {/* Name & Username */}
      <div className="mb-4 w-full">
        <Link
          href={`/person/${person.login}`}
          className="font-extrabold text-base sm:text-lg text-white hover:text-[#22d3ee] transition-colors truncate block"
        >
          {person.name}
        </Link>
        <div className="text-xs text-[#22d3ee] font-mono truncate">
          @{person.login} · <span className="text-slate-500 font-sans">{title}</span>
        </div>
      </div>

      {/* Metric Box */}
      <div className="w-full bg-white/5 rounded-2xl p-3.5 border border-white/10 mb-4">
        <div className="text-2xl font-black text-[#22d3ee] font-mono mb-0.5">
          {person.connections}
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
          DIRECT CO-AUTHORS
        </div>
      </div>

      {/* Action Button */}
      <Link href={`/person/${person.login}`} className="btn-dark-secondary !rounded-full !py-2 text-xs font-mono w-full text-center hover:border-[#22d3ee]">
        EXPLORE NETWORK
      </Link>
    </div>
  );
}
