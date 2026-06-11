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
      hasCustomRpc: Boolean(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
    },
    relayer: {
      // 1Shot public relayer — PERMISSIONLESS gasless EIP-7702/7710 execution.
      // No API key/secret: authentication is via signed delegation payloads.
      // JSON-RPC endpoint; status comes back via signed Ed25519 webhooks.
      endpoint:
        process.env.ONESHOT_RELAYER_URL || "https://relayer.1shotapi.com/relayers",
      permissionless: true,
      // Our public URL where 1Shot POSTs webhook status events (destinationUrl).
      hasWebhookUrl: Boolean(process.env.PUBLIC_WEBHOOK_URL)
    },
    venice: {
      // Natural-language intent -> structured permission JSON.
      hasApiKey: Boolean(process.env.VENICE_API_KEY),
      baseUrl: process.env.VENICE_BASE_URL || "https://api.venice.ai/api/v1",
      model: process.env.VENICE_MODEL || "venice-uncensored"
    },
    storage: {
      // In-memory by default; Postgres when DATABASE_URL is set.
      driver: process.env.DATABASE_URL ? "postgres" : "memory"
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

  // Only the pieces truly required for live on-chain operation. Venice (offline
  // parser fallback) and 1Shot (wallet-transport fallback) are optional, so they
  // do not block readiness.
  if (!env.signer.configured) {
    missing.push("AGENT_LOCAL_PRIVATE_KEY (or a managed signer)");
  }
  if (env.storage.driver !== "postgres") {
    missing.push("DATABASE_URL (Postgres) for durable storage");
  }

  return missing;
}
