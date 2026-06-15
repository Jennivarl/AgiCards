import { ogStorage } from "./storage";
import type { AgiCard } from "./types";
import type { SkillCall } from "./skills/types";
import type { TransportResult } from "./transport";

// Append an execution record to 0G Storage — the tamper-proof audit trail behind
// the dashboard's Audit button. Reuses the existing 0G adapter (mock root in
// dev, real Merkle root when 0G keys are set). Returns the root.
export async function logExecution(
  card: AgiCard,
  call: SkillCall,
  result: TransportResult
): Promise<string> {
  const object = await ogStorage.store("receipt", {
    kind: "agicard-execution",
    cardId: card.id,
    owner: card.owner,
    delegate: card.delegate,
    summary: call.summary,
    amountUsd: call.amountUsd,
    target: call.to,
    status: result.status,
    txHash: result.txHash ?? null,
    taskId: result.taskId ?? null,
    at: new Date().toISOString()
  });
  return object.root;
}
