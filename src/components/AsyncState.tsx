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
  emptyMessage = "No graph data matching parameters.",
  emptyFallback,
  errorFallback,
  children,
}: AsyncStateProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 card-cognodb p-8 max-w-sm w-full text-center border border-white/10 shadow-2xl">
            <div className="loading-spinner-mint" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono tracking-widest text-[#22d3ee] uppercase animate-pulse">
                TRAVERSING COGNODB GRAPH
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Executing openCypher query...
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
          <div className="card-cognodb border-red-500/30 p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Graph Query Error</h3>
            <p className="text-xs font-mono text-slate-400 mb-3">{error}</p>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Verify database connection & openCypher syntax
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
          <div className="card-cognodb p-8 max-w-md w-full text-center border border-white/10">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No Connections Found</h4>
            <p className="text-xs font-mono text-slate-400">{emptyMessage}</p>
          </div>
        </div>
      )
    );
  }

  return <>{children(data as T)}</>;
}
