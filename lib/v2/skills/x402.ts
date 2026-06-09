import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { USDC_ADDRESS, USDC_DECIMALS } from "../tokens";
import type { AgentSkill, SkillCall, SkillInput } from "./types";

// x402 pay-per-use: the agent pays a seller in USDC for access to a service.
// The MVP models settlement as a direct USDC transfer to the seller, executed
// THROUGH the card's delegation so the on-chain daily-cap caveat enforces it.
// The full x402 handshake (HTTP 402 challenge + X-PAYMENT header) layers on top
// of this settlement call.
export const x402Skill: AgentSkill = {
  key: "x402",
  label: "Pay-per-use (x402)",
  async buildCall(input: SkillInput): Promise<SkillCall> {
    const amount = parseUnits(String(input.amountUsd), USDC_DECIMALS);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [input.target, amount]
    });
    const who = `${input.target.slice(0, 6)}…${input.target.slice(-4)}`;
    return {
      to: USDC_ADDRESS,
      data,
      value: 0n,
      amountUsd: input.amountUsd,
      summary: `Paid ${who} $${input.amountUsd.toFixed(2)} USDC${
        input.note ? ` for ${input.note}` : ""
      } via x402`
    };
  }
};
