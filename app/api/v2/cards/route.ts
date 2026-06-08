import { NextResponse } from "next/server";
import type { Address, Hex } from "viem";
import { saveCard, listCards } from "@/lib/v2/cardStore";
import type { AgiCard, PermissionIntent } from "@/lib/v2/types";

export async function GET() {
  return NextResponse.json({ ok: true, cards: listCards() });
}

// Store a freshly-minted card after the browser completes the ERC-7715 grant.
export async function POST(request: Request) {
  let body: {
    id?: string;
    intent?: PermissionIntent;
    owner?: string;
    delegate?: string;
    permissionsContext?: string;
    delegationManager?: string;
    expiry?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, intent, owner, delegate, permissionsContext, delegationManager, expiry } = body;
  if (!id || !intent || !owner || !delegate || !permissionsContext || !delegationManager || !expiry) {
    return NextResponse.json({ ok: false, error: "Missing card fields." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const card: AgiCard = {
    id,
    label: intent.purpose,
    owner: owner as Address,
    delegate: delegate as Address,
    status: "active",
    intent,
    permissionsContext: permissionsContext as Hex,
    delegationManager: delegationManager as Address,
    createdAt: now,
    expiresAt: new Date(expiry * 1000).toISOString(),
    spentUsd: 0,
    auditRoots: []
  };

  saveCard(card);
  return NextResponse.json({ ok: true, card });
}
