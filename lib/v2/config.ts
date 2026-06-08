import { V2_CHAIN, RPC_URL, EXPLORER_URL } from "./chains";

// Central status for the v2 (MetaMask Smart Accounts) stack. Mirrors the shape
// of lib/env.ts so /api/integrations/status can report v2 readiness the same way
// it reports the 0G stack. 0G Storage is reused as the audit layer.
export function getV2EnvStatus() {
  return {
    chain: {
      name: V2_CHAIN.name,
      id: V2_CHAIN.id,
      rpcUrl: RPC_URL,
      explorerUrl: EXPLORER_URL,
      hasCustomRpc: Boolean(process.env.NEXT_PUBLIC_LINEA_RPC_URL)
    },
    relayer: {
      // 1Shot — gasless EIP-7702 upgrade + delegation redemption.
      hasApiKey: Boolean(process.env.ONESHOT_API_KEY),
      hasApiSecret: Boolean(process.env.ONESHOT_API_SECRET),
      hasBusinessId: Boolean(process.env.ONESHOT_BUSINESS_ID),
      hasWebhookSecret: Boolean(process.env.ONESHOT_WEBHOOK_SECRET)
    },
    venice: {
      // Natural-language intent -> structured permission JSON.
      hasApiKey: Boolean(process.env.VENICE_API_KEY),
      baseUrl: process.env.VENICE_BASE_URL || "https://api.venice.ai/api/v1",
      model: process.env.VENICE_MODEL || "venice-uncensored"
    },
    signer: {
      // The background agent's session key (Option B: server-side).
      provider: (process.env.AGENT_SIGNER_PROVIDER || "local").toLowerCase(),
      configured:
        process.env.AGENT_SIGNER_PROVIDER === "turnkey" ||
        process.env.AGENT_SIGNER_PROVIDER === "privy"
          ? Boolean(process.env.TURNKEY_API_PRIVATE_KEY || process.env.PRIVY_APP_SECRET)
          : Boolean(process.env.AGENT_LOCAL_PRIVATE_KEY)
    }
  };
}

export function getMissingV2Env() {
  const env = getV2EnvStatus();
  const missing: string[] = [];

  if (!env.relayer.hasApiKey) missing.push("ONESHOT_API_KEY");
  if (!env.relayer.hasApiSecret) missing.push("ONESHOT_API_SECRET");
  if (!env.venice.hasApiKey) missing.push("VENICE_API_KEY");
  if (!env.signer.configured) {
    missing.push(
      "AGENT_LOCAL_PRIVATE_KEY (dev) or a managed signer (TURNKEY_API_PRIVATE_KEY / PRIVY_APP_SECRET)"
    );
  }

  return missing;
}
