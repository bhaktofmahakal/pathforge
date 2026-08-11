"use client";

import React, { ReactNode } from "react";

interface AsyncStateProps<T> {
  isLoading: boolean;
  error?: string | null;
  data?: T | null;
  isEmpty?: (data: T) => boolean;
  loadingFallback?: ReactNode;
  emptyMessage?: string;
  emptyFallback?: ReactNode;
  errorFallback?: ReactNode;
  children: (data: T) => ReactNode;
}

export function AsyncState<T>({
  isLoading,
  error,
  data,
  isEmpty,
  loadingFallback,
  emptyMessage = "No graph data matching query parameters.",
  emptyFallback,
  errorFallback,
  children,
}: AsyncStateProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 card-xai p-8 max-w-sm w-full text-center border border-[#212327]">
            <div className="loading-spinner-white" />
            <div className="flex flex-col gap-1">
              <p className="eyebrow-mono text-white animate-pulse">
                {"// EXECUTING OPENCYPHER QUERY"}
              </p>
              <p className="text-xs font-mono text-[#7d8187]">
                Traversing CognoDB Cloud graph...
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  // Error state
  if (error) {
    return (
      errorFallback ?? (
        <div className="flex items-center justify-center py-20">
          <div className="card-xai border-[#ff7a17]/40 p-8 max-w-md w-full text-center">
            <div className="w-10 h-10 rounded-full border border-[#ff7a17]/50 flex items-center justify-center mx-auto mb-4 bg-[#191919]">
              <span className="text-[#ff7a17] font-mono text-sm">!</span>
            </div>
            <h3 className="text-base font-normal text-white mb-1">Graph Query Error</h3>
            <p className="text-xs font-mono text-[#7d8187] mb-3">{error}</p>
            <div className="eyebrow-mono text-[#7d8187] text-[10px]">
              {"// VERIFY CONNECTION AND PARAMETERS"}
            </div>
          </div>
        </div>
      )
    );
  }

  // Empty state
  const dataIsEmpty =
    data == null ||
    (isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0);

  if (dataIsEmpty) {
    return (
      emptyFallback ?? (
        <div className="flex items-center justify-center py-20">
          <div className="card-xai p-8 max-w-md w-full text-center border border-[#212327]">
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4 bg-[#191919]">
              <span className="text-[#7d8187] font-mono text-xs">{"//"}</span>
            </div>
            <h4 className="text-sm font-normal text-white mb-1">No Connections Found</h4>
            <p className="text-xs font-mono text-[#7d8187]">{emptyMessage}</p>
          </div>
        </div>
      )
    );
  }

  return <>{children(data as T)}</>;
}
