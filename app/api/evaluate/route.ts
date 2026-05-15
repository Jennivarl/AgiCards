import { NextResponse } from "next/server";
import { ogCompute } from "@/lib/adapters/compute";
import { ogStorage } from "@/lib/adapters/storage";
import { demoPolicy, demoWallet } from "@/lib/demoData";
import type { CardRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode">;
  const risk = await ogCompute.evaluate(body, demoPolicy, demoWallet);
  const decision = await ogStorage.store("decision", {
    request: body,
    risk
  });

  return NextResponse.json({
    risk,
    decisionRoot: decision.root
  });
}

