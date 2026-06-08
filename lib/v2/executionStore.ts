import type { AgentExecution } from "./types";

// In-memory execution log per card (powers the dashboard activity feed). Swap
// for a database alongside cardStore before real use.
const byCard = new Map<string, AgentExecution[]>();

export function addExecution(execution: AgentExecution): AgentExecution {
  const list = byCard.get(execution.cardId) ?? [];
  list.unshift(execution);
  byCard.set(execution.cardId, list);
  return execution;
}

export function listExecutions(cardId: string): AgentExecution[] {
  return byCard.get(cardId) ?? [];
}

export function updateExecution(
  id: string,
  patch: Partial<AgentExecution>
): AgentExecution | undefined {
  for (const list of byCard.values()) {
    const index = list.findIndex((e) => e.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...patch };
      return list[index];
    }
  }
  return undefined;
}
