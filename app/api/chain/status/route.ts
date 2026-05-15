import { NextResponse } from "next/server";
import { ogChain } from "@/lib/adapters/chain";
import { contractExplorerLink } from "@/lib/ogNetwork";

export async function GET() {
  const status = ogChain.status();

  return NextResponse.json({
    ...status,
    explorerUrl: contractExplorerLink(status.registryAddress ?? undefined)
  });
}

