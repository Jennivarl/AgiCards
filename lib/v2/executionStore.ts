import { getStore } from "./store";
import type { AgentExecution } from "./types";

// Thin async facade over the configured Store (in-memory or Postgres).
export const addExecution = (execution: AgentExecution) =>
  getStore().addExecution(execution);
export const listExecutions = (cardId: string) => getStore().listExecutions(cardId);
export const listAllExecutions = () => getStore().listAllExecutions();
export const updateExecution = (id: string, patch: Partial<AgentExecution>) =>
  getStore().updateExecution(id, patch);
