"use client";

import { useEffect, useState } from "react";

export function DbStatusBanner() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        setStatus(res.ok ? "ok" : "error");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  if (status !== "error") return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-sm text-red-300">
      <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2 animate-pulse" />
      Can&apos;t reach the database right now. Some features may be unavailable.
    </div>
  );
}
