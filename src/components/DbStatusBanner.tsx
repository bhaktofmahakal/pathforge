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
      <div className="border-b border-[#212327] bg-[#1a1c20] px-4 py-1.5 text-center text-xs font-mono tracking-widest text-[#ff7a17] uppercase flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a17] animate-pulse" />
        <span>{"// DATABASE UNREACHABLE — RETRYING COGNODB CLOUD"}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-[#212327] bg-[#0a0a0a] px-4 py-1.5 text-center text-xs font-mono tracking-widest text-[#7d8187] uppercase flex items-center justify-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      <span>{"// COGNODB CLOUD CONNECTED"}</span>
      <span>·</span>
      <span className="text-white font-mono">{latency}MS LATENCY</span>
    </div>
  );
}
