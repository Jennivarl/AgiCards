import type { Address, Hex } from "viem";

// In v2 an AgiCard is no longer a separate contract — it is a scoped ERC-7710
// delegation (a session permission) granted from the user's EIP-7702 smart
// account to a background agent. These types describe that permission model.

export type CardStatus = "active" | "expired" | "exhausted" | "revoked";

// The user's plain-English intent, after the prompt parser reads it and BEFORE
// it is compiled into on-chain caveats. Every field is validated by a zod schema
// (lib/v2/intent.ts); the parser never produces raw addresses or calldata.
export type PermissionIntent = {
  purpose: string; // human label, e.g. "DeFi research subscriptions"
  token: "USDC"; // spend asset (allowlisted, not free-form)
  dailyCapUsd: number; // maps to a period-transfer caveat
  perCallCapUsd: number; // maps to a value-lte caveat
  allowedTargets: string[]; // allowlist KEYS (e.g. "uniswap-v3"), resolved server-side to addresses
  expiresInDays: number; // maps to a timestamp caveat
};

// The compiled, on-chain-ready card.
export type AgiCard = {
  id: string;
  label: string;
  owner: Address; // the user's smart account
  delegate: Address; // the agent's session-key address
  status: CardStatus;
  intent: PermissionIntent;
  // ERC-7715 permissions context + the encoded ERC-7710 delegation returned by
  // the wallet on grant. Opaque blobs we store and replay at redemption time.
  permissionsContext: Hex;
  delegationManager: Address;
  createdAt: string;
  expiresAt: string;
  // Mirrored spend for fast UI; on-chain caveat enforcer is the source of truth.
  spentUsd: number;
  // 0G Storage roots for the audit trail.
  auditRoots: string[];
};

// One agent action against a card.
export type AgentExecution = {
  id: string;
  cardId: string;
  summary: string; // "Paid Cursor AI $7.00 via x402"
  amountUsd: number;
  target: Address;
  txHash?: Hex;
  status: "simulating" | "relaying" | "confirmed" | "reverted";
  auditRoot?: string; // 0G Storage root for this step's log
  reasoning?: string; // why the 0G Compute brain allowed this payment
  createdAt: string;
};
