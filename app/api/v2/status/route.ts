import { NextResponse } from "next/server";
import { getV2EnvStatus, getMissingV2Env } from "@/lib/v2/config";

// Live readiness check. Hit this on the deployed domain to see what's
// configured (chain, storage driver, agent signer, execution transport) and
// what's still missing for full live operation.
export async function GET() {
  const missing = getMissingV2Env();
  return NextResponse.json({
    ok: true,
    productionReady: missing.length === 0,
    status: getV2EnvStatus(),
    missing
  });
}
