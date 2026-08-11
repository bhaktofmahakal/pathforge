"use client";

import { useEffect, useState } from "react";

export function DbStatusBanner() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const t0 = performance.now();
    fetch("/api/health")
      .then(async (res) => {
        const ms = Math.round(performance.now() - t0);
        if (res.ok) {
          setStatus("ok");
          setLatency(ms);
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  if (status === "loading") return null;

  if (status === "error") {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs font-mono text-red-300 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span>DATABASE UNREACHABLE — COGNODB CLOUD RETRY IN PROGRESS</span>
      </div>
    );
  }

  return (
    <div className="bg-[#34d399]/5 border-b border-[#34d399]/15 px-4 py-1.5 text-center text-xs font-mono text-slate-300 flex items-center justify-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]"></span>
      </span>
      <span className="text-slate-400">COGNODB CLOUD GRAPH CONNECTED</span>
      <span className="text-slate-600">·</span>
      <span className="text-[#34d399] font-bold">{latency}ms LATENCY</span>
    </div>
  );
}
