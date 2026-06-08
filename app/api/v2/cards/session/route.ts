import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionAddress } from "@/lib/v2/sessionAccount";

// Allocate a new card id and return the agent's delegate (session) address that
// the browser will grant the ERC-7715 permission TO. The session key stays
// server-side — only its address crosses to the client.
export async function POST() {
  const cardId = randomUUID();
  try {
    const sessionAddress = await getSessionAddress(cardId);
    return NextResponse.json({ ok: true, cardId, sessionAddress });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to create session account.";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
