import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { ogStorage } from "@/lib/adapters/storage";
import { makeRoot } from "@/lib/id";
import type { AgentProfile, SpendingPolicy } from "@/lib/types";
import type { Hex } from "viem";

type RegisterAgentBody = {
  agent: AgentProfile;
  policy: SpendingPolicy;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterAgentBody;
  const agentObject = await ogStorage.store("agent", body.agent);
  const policyObject = await ogStorage.store("policy", body.policy);
  const agentId = makeRoot({ agentId: body.agent.id }) as Hex;
  const policyId = makeRoot({ policyId: body.policy.id }) as Hex;

  const agentProof = await ogChain.registerAgent({
    agentId,
    metadataRoot: agentObject.root as Hex
  });
  const policyProof = await ogChain.createPolicy({
    policyId,
    agentId,
    policyRoot: policyObject.root as Hex,
    maxPerRequestOg: String(body.policy.maxPerRequestUsd),
    dailyLimitOg: String(body.policy.dailyLimitUsd)
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
