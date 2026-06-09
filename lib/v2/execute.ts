import { randomUUID } from "node:crypto";
import type { Address } from "viem";
import type { TargetKey } from "./intent";
import type { AgentExecution } from "./types";
import { getCard, updateCard } from "./cardStore";
import { getSkill } from "./skills";
import { getTransport } from "./transport";
import { logExecution } from "./audit";
import { addExecution, updateExecution } from "./executionStore";

export type ExecuteInput = {
  skill: TargetKey;
  target: Address;
  amountUsd: number;
  note?: string;
};

// The agent acts on a card. Every guard here is belt-and-suspenders on top of
// the on-chain caveat enforcer, which is the ultimate source of truth.
export async function executeCardCall(
  cardId: string,
  input: ExecuteInput
): Promise<AgentExecution> {
  const card = await getCard(cardId);
  if (!card) throw new Error("Card not found.");
  if (card.status !== "active") throw new Error(`Card is ${card.status}.`);
  if (!card.intent.allowedTargets.includes(input.skill)) {
    throw new Error(`Card does not allow "${input.skill}".`);
  }
  if (input.amountUsd <= 0) throw new Error("Amount must be positive.");
  if (input.amountUsd > card.intent.perCallCapUsd) {
    throw new Error(`Exceeds per-call cap ($${card.intent.perCallCapUsd}).`);
  }
  if (card.spentUsd + input.amountUsd > card.intent.dailyCapUsd) {
    throw new Error("Would exceed the card's daily cap.");
  }

  const skill = getSkill(input.skill);
  const call = await skill.buildCall({
    target: input.target,
    amountUsd: input.amountUsd,
    note: input.note,
    account: card.owner
  });

  const execution: AgentExecution = {
    id: randomUUID(),
    cardId,
    summary: call.summary,
    amountUsd: call.amountUsd,
    target: call.to,
    status: "relaying",
    createdAt: new Date().toISOString()
  };
  await addExecution(execution);

  const result = await getTransport().submit(call, card);
  const auditRoot = await logExecution(card, call, result);

  if (result.status === "confirmed") {
    await updateCard(cardId, {
      spentUsd: card.spentUsd + call.amountUsd,
      auditRoots: [...card.auditRoots, auditRoot]
    });
  }

  const updated = await updateExecution(execution.id, {
    status: result.status,
    txHash: result.txHash,
    auditRoot
  });
  return updated ?? execution;
}
