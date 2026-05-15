import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { stripeIssuing } from "@/lib/adapters/stripe";
import { ogStorage } from "@/lib/adapters/storage";
import { web3Card } from "@/lib/adapters/web3Card";
import { makeRoot } from "@/lib/id";
import type { CardRequest } from "@/lib/types";
import type { Hex } from "viem";

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
  const requestIdRoot = makeRoot({ requestId: cardRequest.id }) as Hex;
  const decisionRoot = (cardRequest.decisionRoot || makeRoot({ requestId: cardRequest.id, status: "approved" })) as Hex;
  const cardMetadataRoot = makeRoot(metadata) as Hex;
  const approvalProof = await ogChain.approveCardRequest(requestIdRoot, decisionRoot);
  const cardProof =
    cardRequest.mode === "stripe"
      ? await ogChain.linkStripeCard(requestIdRoot, makeRoot(metadata.cardId) as Hex, cardMetadataRoot)
      : await ogChain.createWeb3Card(requestIdRoot, makeRoot(metadata.cardId) as Hex, cardMetadataRoot);
  const spendProof =
    cardRequest.mode === "stripe"
      ? await ogChain.logStripeAuthorization(requestIdRoot, String(cardRequest.amountUsd), receipt.root as Hex)
      : await ogChain.logWeb3Spend(requestIdRoot, String(cardRequest.amountUsd), receipt.root as Hex);

  return NextResponse.json({
    metadata,
    receiptRoot: receipt.root,
    chainProofs: [
      { label: "Card approval", hash: approvalProof.hash, mode: approvalProof.mode },
      {
        label: cardRequest.mode === "stripe" ? "Stripe card linked" : "0G Web3 card created",
        hash: cardProof.hash,
        mode: cardProof.mode
      },
      {
        label: cardRequest.mode === "stripe" ? "Stripe authorization logged" : "Web3 spend logged",
        hash: spendProof.hash,
        mode: spendProof.mode
      }
    ]
  });
}
