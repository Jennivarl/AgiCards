import { createPublicClient, http, type Chain } from "viem";
import { lineaSepolia } from "viem/chains";

// AgiCards v2 runs on Linea Sepolia — the MetaMask Smart Accounts Kit and
// EIP-7702 are first-class supported there (Consensys builds both MetaMask and
// Linea). Production mainnet is a one-line swap of `V2_CHAIN`.
export const V2_CHAIN: Chain = lineaSepolia;

export const RPC_URL =
  process.env.NEXT_PUBLIC_LINEA_RPC_URL || V2_CHAIN.rpcUrls.default.http[0];

export const EXPLORER_URL =
  V2_CHAIN.blockExplorers?.default.url || "https://sepolia.lineascan.build";

export function publicClient() {
  return createPublicClient({ chain: V2_CHAIN, transport: http(RPC_URL) });
}
