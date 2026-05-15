import { NextResponse } from "next/server";
import { ogCompute } from "@/lib/adapters/compute";
import { ogStorage } from "@/lib/adapters/storage";
import { demoPolicy, demoWallet } from "@/lib/demoData";
import type { CardRequest, SpendingPolicy, WalletState } from "@/lib/types";

type EvaluateBody = Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode"> & {
  policy?: SpendingPolicy;
  wallet?: WalletState;
};

export async function GET() {
  return NextResponse.json(ogCompute.status());
}

export async function POST(request: Request) {
  const body = (await request.json()) as EvaluateBody;
  const { policy = demoPolicy, wallet = demoWallet, ...cardRequest } = body;
  const risk = await ogCompute.evaluate(cardRequest, policy, wallet);
  const decision = await ogStorage.store("decision", {
    request: cardRequest,
    policy,
    wallet,
    risk
  });

  return NextResponse.json({
    risk,
    decisionRoot: decision.root
  });
}
