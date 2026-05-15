import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { ogStorage } from "@/lib/adapters/storage";
import type { Hex } from "viem";

type DepositBody = {
  owner: string;
  amountUsd: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as DepositBody;
  const receipt = await ogStorage.store("deposit", {
    owner: body.owner,
    amountUsd: body.amountUsd,
    createdAt: new Date().toISOString()
  });
  const proof = await ogChain.depositFunds(receipt.root as Hex, String(body.amountUsd));

  return NextResponse.json({
    receiptRoot: receipt.root,
    chainProof: {
      label: "Wallet funded",
      hash: proof.hash,
      mode: proof.mode
    }
  });
}
