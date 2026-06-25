import { recoverMessageAddress, isAddress, type Hex } from "viem";
import type { AgiCard } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Owner authorization for money-moving / card-mutating endpoints.
//
// The API is public, so without this anyone who learns a cardId could spend or
// revoke someone else's card (bounded by the on-chain cap, but still theft and
// griefing). Here the caller proves they control the card's OWNER address by
// signing a short capability message with that wallet. They sign ONCE per card
// (valid for a window), so the auto-pay agent can keep acting without a popup
// each time, while a stranger can never act on a card they don't own.
// ─────────────────────────────────────────────────────────────────────────────

export type OwnerAuth = { message: string; signature: Hex };
export type CardAction = "spend" | "revoke";

// Human-readable first line so MetaMask shows the user exactly what they are
// authorizing — different wording for spending vs revoking.
const ACTION_LINE: Record<CardAction, string> = {
  spend: "AgiCards: authorize agent actions on this card.",
  revoke: "AgiCards: authorize revoking this card."
};

// The exact message the owner signs. The Action field is also verified server
// side, so a "spend" signature can never be replayed to revoke, or vice versa.
export function buildAuthMessage(
  cardId: string,
  owner: string,
  expiresAtMs: number,
  action: CardAction
): string {
  return [
    ACTION_LINE[action],
    `Card: ${cardId}`,
    `Owner: ${owner}`,
    `Action: ${action}`,
    `Expires: ${expiresAtMs}`
  ].join("\n");
}

function parseField(message: string, key: string): string {
  const line = message.split("\n").find((l) => l.startsWith(`${key}: `));
  return line ? line.slice(key.length + 2).trim() : "";
}

// Throws a clear error unless `auth` is a valid, unexpired signature from the
// card's owner for this exact card.
export async function requireCardOwner(
  card: AgiCard,
  auth: OwnerAuth | undefined,
  expectedAction: CardAction
): Promise<void> {
  if (!auth?.message || !auth?.signature) {
    throw new Error("Not authorized: missing owner signature.");
  }

  const cardId = parseField(auth.message, "Card");
  const owner = parseField(auth.message, "Owner");
  const action = parseField(auth.message, "Action");
  const expires = Number(parseField(auth.message, "Expires"));

  if (cardId !== card.id) throw new Error("Not authorized: signature is for a different card.");
  if (action !== expectedAction) {
    throw new Error(`Not authorized: this signature authorizes "${action || "?"}", not "${expectedAction}".`);
  }
  if (!isAddress(owner) || owner.toLowerCase() !== card.owner.toLowerCase()) {
    throw new Error("Not authorized: owner mismatch.");
  }
  if (!Number.isFinite(expires) || expires < Date.now()) {
    throw new Error("Authorization expired — re-authorize this card.");
  }

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message: auth.message, signature: auth.signature });
  } catch {
    throw new Error("Not authorized: bad signature.");
  }
  if (recovered.toLowerCase() !== card.owner.toLowerCase()) {
    throw new Error("Not authorized: signature does not match the card owner.");
  }
}
