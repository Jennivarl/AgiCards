import { createPublicClient, http, type Chain } from "viem";
import { base } from "viem/chains";

// AgiCards v2 runs on BASE MAINNET. MetaMask Advanced Permissions (ERC-7715) and
// the Smart Accounts delegation framework are both deployed on Base, and 1Shot's
// gasless relayer + native USDC + x402 are all live there. Spends are REAL money,
// but each card's cap is enforced on-chain, so it can never exceed its limit.
export const V2_CHAIN: Chain = base;

export const RPC_URL =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || V2_CHAIN.rpcUrls.default.http[0];

export const EXPLORER_URL =
  V2_CHAIN.blockExplorers?.default.url || "https://basescan.org";

export function publicClient() {
  return createPublicClient({ chain: V2_CHAIN, transport: http(RPC_URL) });
}
