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
        className="inline-flex items-center gap-2 eyebrow-mono text-xs text-[#7d8187] hover:text-white mb-8 transition-colors"
      >
        <span>← BACK TO SEARCH OVERVIEW</span>
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
            <div className="card-xai p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 justify-between text-center md:text-left border border-[#212327]">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/30 object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="eyebrow-mono text-[#7d8187] text-[11px] mb-1">{"// CONTRIBUTOR PROFILE"}</div>
                  <h1 className="text-3xl sm:text-5xl font-normal text-white mb-2 tracking-[-0.03em] leading-tight">
                    {person.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-[#dadbdf] font-mono">
                    <span className="text-white font-normal">@{person.login}</span>
                    {person.company && <span>· {person.company}</span>}
                    {person.location && <span>· {person.location}</span>}
                  </div>
                  {person.bio && (
                    <p className="text-xs sm:text-sm text-[#dadbdf] mt-3 max-w-xl leading-relaxed font-normal">
                      {person.bio}
                    </p>
                  )}

                  {/* GitHub Profile Link */}
                  <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                    <a
                      href={person.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-xai-outline text-xs font-mono !py-1 !px-3.5"
                    >
                      <span>GITHUB PROFILE ➔</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Action buttons */}
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 w-full md:w-auto mt-4 md:mt-0">
                <Link href={`/path?from=${person.login}`} className="btn-xai-primary !py-2 !px-4 text-xs font-mono">
                  FIND PATH
                </Link>
                <Link href={`/connect?me=${person.login}`} className="btn-xai-outline !py-2 !px-4 text-xs font-mono">
                  GET INTRODUCED
                </Link>
                <Link href={`/recommend?login=${person.login}`} className="btn-xai-outline !py-2 !px-4 text-xs font-mono">
                  RECOMMENDED REPOS
                </Link>
              </div>
            </div>

            {/* Closest Network Collaborators Section */}
            {person.topCollaborators && person.topCollaborators.length > 0 && (
              <div>
                <div className="flex items-center justify-between card-xai px-5 py-3 mb-4 border border-[#212327]">
                  <h2 className="eyebrow-mono text-white text-xs">
                    {`// CLOSEST NETWORK COLLABORATORS (${person.topCollaborators.length})`}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                  {person.topCollaborators.map((collab) => (
                    <Link
                      key={collab.login}
                      href={`/person/${collab.login}`}
                      className="card-xai p-4 text-center flex flex-col items-center justify-between group border border-[#212327]"
                    >
                      <img
                        src={collab.avatarUrl}
                        alt={collab.name}
                        className="w-12 h-12 rounded-full border border-white/20 object-cover mb-2"
                      />
                      <div className="font-normal text-xs text-white group-hover:underline truncate w-full">
                        {collab.name}
                      </div>
                      <div className="text-[11px] text-[#7d8187] font-mono truncate w-full mb-1">
                        @{collab.login}
                      </div>
                      <span className="btn-xai-outline !py-0.5 !px-2 text-[9px] font-mono text-[#dadbdf]">
                        {collab.sharedRepos} {collab.sharedRepos === 1 ? "repo" : "repos"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contributed Repositories */}
            <div>
              <div className="flex items-center justify-between card-xai px-5 py-3 mb-4 border border-[#212327]">
                <h2 className="eyebrow-mono text-white text-xs">
                  {`// CONTRIBUTED REPOSITORIES (${person.contributedRepos.length})`}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.contributedRepos.map((repo) => (
                  <div key={repo.fullName} className="card-xai p-6 flex flex-col justify-between border border-[#212327]">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-normal text-white hover:underline text-base flex items-center gap-1.5 break-all"
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

                    <div className="flex items-center justify-between text-xs text-[#7d8187] border-t border-[#212327] pt-3.5 mt-2 font-mono">
                      <span className="text-white">
                        ★ {repo.stars.toLocaleString()} stars
                      </span>
                      <span className="text-[#dadbdf]">
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
