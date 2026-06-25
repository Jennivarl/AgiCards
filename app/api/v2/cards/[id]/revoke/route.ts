import { NextResponse } from "next/server";
import { getCard, updateCard } from "@/lib/v2/cardStore";
import { requireCardOwner, type OwnerAuth } from "@/lib/v2/auth";

// Burn the card. MVP marks it revoked so the agent stops using it immediately.
// Production also calls the on-chain delegation disable (disableDelegation) so
// the permission is void at the contract level too. Owner-only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const card = await getCard(id);
  if (!card) {
    return NextResponse.json({ ok: false, error: "Card not found." }, { status: 404 });
  }

  let body: { auth?: OwnerAuth };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  try {
    await requireCardOwner(card, body.auth, "revoke");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Not authorized." },
      { status: 403 }
    );
  }

  const updated = await updateCard(id, { status: "revoked" });
  return NextResponse.json({ ok: true, card: updated });
}
