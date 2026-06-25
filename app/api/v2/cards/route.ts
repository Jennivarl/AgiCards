import { NextResponse } from "next/server";
import type { Address, Hex } from "viem";
import { saveCard, listCards } from "@/lib/v2/cardStore";
import { permissionIntentSchema } from "@/lib/v2/intent";
import type { AgiCard, PermissionIntent } from "@/lib/v2/types";

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner");
  const all = await listCards();
  const cards = owner
    ? all.filter((c) => c.owner.toLowerCase() === owner.toLowerCase())
    : all;
  return NextResponse.json({ ok: true, cards });
}

// Store a freshly-minted card after the browser completes the ERC-7715 grant.
export async function POST(request: Request) {
  let body: {
    id?: string;
    name?: string;
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

  // The limits are the safety net — re-validate them server-side so a forged or
  // malformed request can never store a card outside the allowed bounds.
  const validIntent = permissionIntentSchema.safeParse(intent);
  if (!validIntent.success) {
    return NextResponse.json(
      { ok: false, error: validIntent.error.issues[0]?.message ?? "Invalid card limits." },
      { status: 400 }
    );
  }
  const safeIntent = validIntent.data as PermissionIntent;

  const now = new Date().toISOString();
  const card: AgiCard = {
    id,
    label: body.name?.trim() || safeIntent.purpose,
    owner: owner as Address,
    delegate: delegate as Address,
    status: "active",
    intent: safeIntent,
    permissionsContext: permissionsContext as Hex,
    delegationManager: delegationManager as Address,
    createdAt: now,
    expiresAt: new Date(expiry * 1000).toISOString(),
    spentUsd: 0,
    auditRoots: []
  };

  await saveCard(card);
  return NextResponse.json({ ok: true, card });
}
