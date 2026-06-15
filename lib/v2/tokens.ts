import type { Address } from "viem";

// USDC on Base mainnet (the asset 1Shot accepts and x402 settles in). Override
// via env for a different token. AgiCards spends are denominated in this asset;
// caps are converted with USDC_DECIMALS.
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address;

export const USDC_DECIMALS = 6;

// Uniswap V3 on Base (for the swap skill). VERIFY against Base before any live
// swap — a wrong router address means lost funds.
export const WETH_ADDRESS = (process.env.NEXT_PUBLIC_WETH_ADDRESS ||
  "0x4200000000000000000000000000000000000006") as Address;

export const UNISWAP_V3_ROUTER = (process.env.NEXT_PUBLIC_UNISWAP_V3_ROUTER ||
  "0x2626664c2603336E57B271c5C0b26F421741e481") as Address;

export const UNISWAP_V3_FEE = 3000; // 0.3% pool
