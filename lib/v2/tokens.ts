import type { Address } from "viem";

// USDC on Sepolia (the token used in MetaMask's Advanced Permissions examples).
// Override via env for a different test token. AgiCards spends are denominated
// in this asset; caps are converted with USDC_DECIMALS.
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238") as Address;

export const USDC_DECIMALS = 6;
