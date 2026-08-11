"use client";

import React, { ReactNode } from "react";

interface AsyncStateProps<T> {
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if something went wrong */
  error?: string | null;
  /** The data (null/undefined = empty state) */
  data?: T | null;
  /** Check for empty (default: falsy or empty array) */
  isEmpty?: (data: T) => boolean;
  /** Content to show while loading */
  loadingFallback?: ReactNode;
  /** Content to show when data is empty */
  emptyMessage?: string;
  emptyFallback?: ReactNode;
  /** Content to show on error */
  errorFallback?: ReactNode;
  /** Render the data */
  children: (data: T) => ReactNode;
}

export function AsyncState<T>({
  isLoading,
  error,
  data,
  isEmpty,
  loadingFallback,
  emptyMessage = "Nothing found.",
  emptyFallback,
  errorFallback,
  children,
}: AsyncStateProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner" />
            <p className="text-sm text-white/50 animate-pulse">Loading…</p>
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
          <div className="glass-card border-red-500/30 p-8 max-w-md text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-white/60">{error}</p>
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
          <div className="glass-card p-8 max-w-md text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-white/50">{emptyMessage}</p>
          </div>
        </div>
      )
    );
  }

  // Data state — render children
  return <>{children(data as T)}</>;
}
