import { NextResponse } from "next/server";
import { stripeIssuing } from "@/lib/adapters/stripe";
import { ogStorage } from "@/lib/adapters/storage";
import { web3Card } from "@/lib/adapters/web3Card";
import type { CardRequest } from "@/lib/types";

export async function POST(request: Request) {
  const cardRequest = (await request.json()) as CardRequest;
  const metadata =
    cardRequest.mode === "stripe"
      ? await stripeIssuing.createVirtualCard(cardRequest)
      : await web3Card.createCard(cardRequest);

  const receipt = await ogStorage.store("receipt", {
    requestId: cardRequest.id,
    agentId: cardRequest.agentId,
    mode: cardRequest.mode,
    merchant: cardRequest.merchant,
    amountUsd: cardRequest.amountUsd,
    metadata
  });

  return NextResponse.json({
    metadata,
    receiptRoot: receipt.root
  });
}

