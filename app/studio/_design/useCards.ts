"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgiCard } from "@/lib/v2/types";

// Live card list for the /studio dashboard. Reads GET /api/v2/cards (the same
// endpoint the working /app/v2 CardsList uses) and exposes a refresh() so a
// fresh mint or revoke can re-pull.
export function useCards() {
  const [cards, setCards] = useState<AgiCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/v2/cards");
      const data = await res.json();
      if (data.ok) setCards(data.cards as AgiCard[]);
      else setError(data.error || "Failed to load cards.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cards, loading, error, refresh };
}
