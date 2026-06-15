"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgiCard } from "@/lib/v2/types";
import { useWallet } from "./WalletProvider";

// Live card list for the /studio dashboard, scoped to the connected wallet so a
// user only ever sees their own cards. Exposes refresh() so a fresh mint or
// revoke can re-pull.
export function useCards() {
  const { address } = useWallet();
  const [cards, setCards] = useState<AgiCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const url = address ? `/api/v2/cards?owner=${address}` : "/api/v2/cards";
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) setCards(data.cards as AgiCard[]);
      else setError(data.error || "Failed to load cards.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cards, loading, error, refresh };
}
