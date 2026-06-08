import type { Address, Hex } from "viem";
import type { TargetKey } from "../intent";

// What the agent is asked to do with a card.
export type SkillInput = {
  seller: Address;
  amountUsd: number;
  note?: string;
};

// A concrete on-chain call the agent wants to make, ready to be redeemed
// against a card's delegation.
export type SkillCall = {
  to: Address;
  data: Hex;
  value: bigint;
  amountUsd: number;
  summary: string;
};

// A pluggable agent capability (x402 today, swaps next). Same rails, different
// action — mirrors the swappable signer design.
export interface AgentSkill {
  key: TargetKey;
  label: string;
  buildCall(input: SkillInput): Promise<SkillCall>;
}
