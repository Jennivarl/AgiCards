import { getStore } from "./store";
import type { AgiCard } from "./types";

// Thin async facade over the configured Store (in-memory or Postgres).
export const saveCard = (card: AgiCard) => getStore().saveCard(card);
export const getCard = (id: string) => getStore().getCard(id);
export const listCards = () => getStore().listCards();
export const updateCard = (id: string, patch: Partial<AgiCard>) =>
  getStore().updateCard(id, patch);
