import type { Address } from "viem";

// USDC on Sepolia (the token used in MetaMask's Advanced Permissions examples).
// Override via env for a different test token. AgiCards spends are denominated
// in this asset; caps are converted with USDC_DECIMALS.
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238") as Address;

export const USDC_DECIMALS = 6;

// Uniswap V3 on Sepolia (for the swap skill). Verify these against the target
// chain before a live run — addresses differ per network.
export const WETH_ADDRESS = (process.env.NEXT_PUBLIC_WETH_ADDRESS ||
  "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14") as Address;

export const UNISWAP_V3_ROUTER = (process.env.NEXT_PUBLIC_UNISWAP_V3_ROUTER ||
  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E") as Address;

export const UNISWAP_V3_FEE = 3000; // 0.3% pool
