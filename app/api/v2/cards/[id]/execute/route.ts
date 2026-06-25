import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { executeCardCall } from "@/lib/v2/execute";
import { getCard } from "@/lib/v2/cardStore";
import { requireCardOwner, type OwnerAuth } from "@/lib/v2/auth";
import type { TargetKey } from "@/lib/v2/intent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    skill?: TargetKey;
    target?: string;
    amountUsd?: number;
    note?: string;
    auth?: OwnerAuth;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.skill || !body.target || !body.amountUsd) {
    return NextResponse.json(
      { ok: false, error: "Missing skill, target, or amountUsd." },
      { status: 400 }
    );
  }
  if (!isAddress(body.target)) {
    return NextResponse.json({ ok: false, error: "Invalid recipient address." }, { status: 400 });
  }

  // Only the card's owner may move its money.
  const card = await getCard(id);
  if (!card) {
    return NextResponse.json({ ok: false, error: "Card not found." }, { status: 404 });
  }
  try {
    await requireCardOwner(card, body.auth, "spend");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Not authorized." },
      { status: 403 }
    );
  }

  try {
    const execution = await executeCardCall(id, {
      skill: body.skill,
      target: body.target as Address,
      amountUsd: body.amountUsd,
      note: body.note
    });
    return NextResponse.json({ ok: true, execution });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Execution failed.";
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
