"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentExecution } from "@/lib/v2/types";

// All executions across every card (GET /api/v2/executions). Powers the
// dashboard Recent Activity panel and the Activity page.
export function useExecutions() {
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/v2/executions");
      const data = await res.json();
      if (data.ok) setExecutions(data.executions as AgentExecution[]);
      else setError(data.error || "Failed to load activity.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { executions, loading, error, refresh };
}

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86_400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
