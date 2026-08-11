/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AsyncState } from "@/components/AsyncState";
import { PersonProfile } from "@/lib/queries";

export default function PersonPage() {
  const params = useParams();
  const login = params.login as string;

  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!login) return;
    setIsLoading(true);
    setError(null);

    fetch(`/api/person/${encodeURIComponent(login)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Contributor '${login}' was not found in the network.`);
          }
          throw new Error("Unable to load profile. Please try again.");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data.person);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [login]);

  return (
    <div className="container-narrow">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 sm:mb-8 transition-colors font-mono tracking-wider uppercase"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>BACK TO OVERVIEW</span>
      </Link>

      <AsyncState
        isLoading={isLoading}
        error={error}
        data={profile}
        emptyMessage={`No contributor found for '${login}'.`}
      >
        {(person) => (
          <div className="space-y-8">
            {/* Header card */}
            <div className="card-cognodb p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 justify-between text-center md:text-left border border-white/10 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/20 object-cover flex-shrink-0 shadow-lg"
                />
                <div className="min-w-0">
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight leading-none">
                    {person.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-400 font-mono">
                    <span className="text-[#22d3ee] font-bold">@{person.login}</span>
                    {person.company && <span>· {person.company}</span>}
                    {person.location && <span>· {person.location}</span>}
                  </div>
                  {person.bio && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl leading-relaxed font-normal">
                      {person.bio}
                    </p>
                  )}

                  {/* GitHub Profile Link */}
                  <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                    <a
                      href={person.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-xs text-slate-200 hover:text-white font-mono transition-all"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GITHUB PROFILE ➔</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Action buttons */}
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 w-full md:w-auto mt-4 md:mt-0">
                <Link href={`/path?from=${person.login}`} className="btn-mint !rounded-full !px-4 !py-2 text-xs font-mono">
                  FIND PATH
                </Link>
                <Link href={`/connect?me=${person.login}`} className="btn-dark-secondary !rounded-full !px-4 !py-2 text-xs font-mono">
                  GET INTRODUCED
                </Link>
                <Link href={`/recommend?login=${person.login}`} className="btn-dark-secondary !rounded-full !px-4 !py-2 text-xs font-mono">
                  RECOMMENDED REPOS
                </Link>
              </div>
            </div>

            {/* Closest Network Collaborators Section */}
            {person.topCollaborators && person.topCollaborators.length > 0 && (
              <div>
                <div className="flex items-center justify-between card-cognodb px-5 py-3 mb-4 border border-[#22d3ee]/30">
                  <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    CLOSEST NETWORK COLLABORATORS ({person.topCollaborators.length})
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                  {person.topCollaborators.map((collab) => (
                    <Link
                      key={collab.login}
                      href={`/person/${collab.login}`}
                      className="card-cognodb p-4 text-center flex flex-col items-center justify-between group border border-white/10 hover:border-[#22d3ee]/40 shadow-md"
                    >
                      <img
                        src={collab.avatarUrl}
                        alt={collab.name}
                        className="w-12 h-12 rounded-full border border-white/20 object-cover mb-2 group-hover:scale-105 transition-transform"
                      />
                      <div className="font-bold text-xs text-white group-hover:text-[#22d3ee] transition-colors truncate w-full">
                        {collab.name}
                      </div>
                      <div className="text-[11px] text-[#22d3ee] font-mono truncate w-full mb-1">
                        @{collab.login}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/30 text-[9px] font-mono">
                        {collab.sharedRepos} shared {collab.sharedRepos === 1 ? "repo" : "repos"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contributed Repositories */}
            <div>
              <div className="flex items-center justify-between card-cognodb px-5 py-3 mb-4 border border-[#22d3ee]/30">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                  CONTRIBUTED REPOSITORIES ({person.contributedRepos.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.contributedRepos.map((repo) => (
                  <div key={repo.fullName} className="card-cognodb p-6 flex flex-col justify-between group border border-white/10 shadow-lg hover:border-[#22d3ee]/40">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white hover:text-[#22d3ee] transition-colors text-sm sm:text-base flex items-center gap-1.5 break-all"
                        >
                          {repo.fullName}
                          <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/30 uppercase">
                          {repo.primaryLanguage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-normal">
                        {repo.description || "No description available."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-3.5 mt-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                        <svg className="w-3.5 h-3.5 fill-amber-300" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stars.toLocaleString()} stars
                      </span>
                      <span className="text-[#22d3ee] font-bold font-mono">
                        {repo.commits} {repo.commits === 1 ? "commit" : "commits"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AsyncState>
    </div>
  );
}
