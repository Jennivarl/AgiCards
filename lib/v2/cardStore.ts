import type { AgiCard } from "./types";

// In-memory card store for the MVP. Survives within a running server process;
// swap for a database (the AgiCard shape is persistence-ready) before real use.
const cards = new Map<string, AgiCard>();

export function saveCard(card: AgiCard): AgiCard {
  cards.set(card.id, card);
  return card;
}

export function getCard(id: string): AgiCard | undefined {
  return cards.get(id);
}

export function listCards(): AgiCard[] {
  return [...cards.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateCard(id: string, patch: Partial<AgiCard>): AgiCard | undefined {
  const existing = cards.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  cards.set(id, updated);
  return updated;
}
