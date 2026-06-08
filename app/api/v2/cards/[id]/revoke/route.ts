import { NextResponse } from "next/server";
import { getCard, updateCard } from "@/lib/v2/cardStore";

// Burn the card. MVP marks it revoked so the agent stops using it immediately.
// Production also calls the on-chain delegation disable (disableDelegation) so
// the permission is void at the contract level too.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getCard(id)) {
    return NextResponse.json({ ok: false, error: "Card not found." }, { status: 404 });
  }
  const card = updateCard(id, { status: "revoked" });
  return NextResponse.json({ ok: true, card });
}
