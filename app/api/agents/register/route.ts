import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { ogStorage } from "@/lib/adapters/storage";
import { demoAgent, demoPolicy } from "@/lib/demoData";
import { makeRoot } from "@/lib/id";
import type { Hex } from "viem";

export async function POST() {
  const agentObject = await ogStorage.store("agent", demoAgent);
  const policyObject = await ogStorage.store("policy", demoPolicy);
  const agentId = makeRoot({ agentId: demoAgent.id }) as Hex;
  const policyId = makeRoot({ policyId: demoPolicy.id }) as Hex;

  const agentProof = await ogChain.registerAgent({
    agentId,
    metadataRoot: agentObject.root as Hex
  });
  const policyProof = await ogChain.createPolicy({
    policyId,
    agentId,
    policyRoot: policyObject.root as Hex,
    maxPerRequestOg: String(demoPolicy.maxPerRequestUsd),
    dailyLimitOg: String(demoPolicy.dailyLimitUsd)
  });

  return NextResponse.json({
    agentRoot: agentObject.root,
    policyRoot: policyObject.root,
    chainProofs: [
      {
        label: "Agent registered",
        hash: agentProof.hash,
        mode: agentProof.mode
      },
      {
        label: "Policy created",
        hash: policyProof.hash,
        mode: policyProof.mode
      }
    ]
  });
}
