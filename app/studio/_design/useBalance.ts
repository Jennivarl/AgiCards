"use client";

import { useState, useEffect } from "react";
import { erc20Abi, formatUnits, type Address } from "viem";
import { publicClient } from "@/lib/v2/chains";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/lib/v2/tokens";

// Live USDC balance (on Base) for the connected wallet. Re-reads when the address
// changes and every 15s so it reflects spends. Returns a formatted string, or
// undefined while loading / not connected.
export function useUsdcBalance(address?: Address) {
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!address) {
      setBalance(undefined);
      return;
    }
    let cancelled = false;

    async function read() {
      try {
        const bal = await publicClient().readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address],
        });
        if (!cancelled) setBalance(formatUnits(bal, USDC_DECIMALS));
      } catch {
        if (!cancelled) setBalance(undefined);
      }
    }

    read();
    const t = setInterval(read, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [address]);

  return balance;
}
