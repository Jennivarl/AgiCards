import type { AgiCard } from "../types";
import { askBrain, brainConfigured } from "./compute";

// Spot 2: the agent's BRAIN approves each payment, on 0G Compute.
//
// The blockchain already enforces the hard money caps (daily + per-charge). This
// is a SEMANTIC check on top: does this specific payment actually fit what the
// card is for? It catches spends that are within the caps but off-purpose.
//
// Fails OPEN: if the 0G brain is not configured or unreachable, the payment
// still proceeds, protected by the on-chain caps. The brain only ever adds a
// layer; it never becomes a single point of failure for spending.

export type Verdict = {
  allow: boolean;
  reason: string;
  source: "0g-compute" | "skipped";
};

const SYSTEM_PROMPT = `You are the safety brain of an AI agent's spending card.
You decide whether ONE proposed payment fits the card's purpose.
The blockchain already enforces the money caps, so do not worry about limits — judge fit only.
Reply with ONLY a JSON object: {"allow": true or false, "reason": "<one short sentence>"}.
Allow payments that clearly match the purpose. Deny payments that are off-purpose, suspicious, or wasteful.
When unsure, allow.`;

export async function judgePayment(
  card: AgiCard,
  input: { skill: string; target: string; amountUsd: number; note?: string }
): Promise<Verdict> {
  if (!brainConfigured()) {
    return { allow: true, reason: "Approved within your set limits.", source: "skipped" };
  }

  const userMsg = [
    `Card purpose: ${card.intent.purpose}`,
    `Allowed for: ${card.intent.allowedTargets.join(", ")}`,
    `Caps: $${card.intent.dailyCapUsd}/day, $${card.intent.perCallCapUsd}/charge, already spent today $${card.spentUsd}`,
    `Proposed payment: ${input.skill} to ${input.target} for $${input.amountUsd}${input.note ? ` (note: ${input.note})` : ""}`,
    `Does this payment fit the card's purpose?`
  ].join("\n");

  try {
    const reply = await askBrain(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg }
      ],
      { maxTokens: 2048 }
    );
    const match = reply.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { allow?: boolean; reason?: string };
      const allow = parsed.allow !== false; // default to allow unless explicitly false
      return {
        allow,
        reason: parsed.reason || (allow ? "Fits the card's purpose." : "Off-purpose payment."),
        source: "0g-compute"
      };
    }
  } catch {
    // Brain unreachable — fail open; the on-chain caps still protect the user.
  }

  return { allow: true, reason: "Approved within your set limits.", source: "skipped" };
}
