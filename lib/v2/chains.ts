import { createPublicClient, http, type Chain } from "viem";
import { sepolia } from "viem/chains";

// AgiCards v2 runs on ETHEREUM SEPOLIA. The MetaMask Snaps that power ERC-7715
// Advanced Permissions — the "mint card" step — currently work ONLY on Sepolia,
// so the whole app targets Sepolia. The official Smart Accounts Kit quickstart
// uses the same chain. Production mainnet is a one-line swap of V2_CHAIN.
export const V2_CHAIN: Chain = sepolia;

export const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || V2_CHAIN.rpcUrls.default.http[0];

export const EXPLORER_URL =
  V2_CHAIN.blockExplorers?.default.url || "https://sepolia.etherscan.io";

export function publicClient() {
  return createPublicClient({ chain: V2_CHAIN, transport: http(RPC_URL) });
}
