import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { ogCompute } from "@/lib/adapters/compute";
import { ogStorage } from "@/lib/adapters/storage";
import { stripeIssuing } from "@/lib/adapters/stripe";
import { getEnvStatus, getMissingLiveEnv } from "@/lib/env";
import { contractExplorerLink } from "@/lib/ogNetwork";

export async function GET() {
  const chain = ogChain.status();
  const storage = ogStorage.status();
  const compute = ogCompute.status();
  const stripe = stripeIssuing.status();

  return NextResponse.json({
    env: getEnvStatus(),
    missingLiveEnv: getMissingLiveEnv(),
    chain: {
      ...chain,
      mode: chain.configured ? "live-ready" : "mock",
      explorerUrl: contractExplorerLink(chain.registryAddress ?? undefined)
    },
    storage: {
      ...storage,
      mode: storage.configured ? "live-ready" : "mock"
    },
    compute: {
      ...compute,
      mode: compute.configured ? "live-ready" : "local-policy"
    },
    stripe
  });
}
