export function getEnvStatus() {
  return {
    chain: {
      hasRpcUrl: Boolean(process.env.NEXT_PUBLIC_0G_RPC_URL),
      hasRegistryAddress: Boolean(process.env.AGICARDS_REGISTRY_ADDRESS),
      hasPrivateKey: Boolean(process.env.DEPLOYER_PRIVATE_KEY)
    },
    storage: {
      hasIndexerRpc: Boolean(process.env.OG_STORAGE_INDEXER_RPC),
      hasPrivateKey: Boolean(process.env.OG_STORAGE_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY)
    },
    compute: {
      hasBaseUrl: Boolean(process.env.OG_COMPUTE_BASE_URL),
      hasApiKey: Boolean(process.env.OG_COMPUTE_API_KEY),
      hasModel: Boolean(process.env.OG_COMPUTE_MODEL)
    },
    stripe: {
      hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      issuingEnabled: process.env.STRIPE_ISSUING_ENABLED === "true"
    }
  };
}

export function getMissingLiveEnv() {
  const env = getEnvStatus();
  const missing: string[] = [];

  if (!env.chain.hasRpcUrl) missing.push("NEXT_PUBLIC_0G_RPC_URL");
  if (!env.chain.hasRegistryAddress) missing.push("AGICARDS_REGISTRY_ADDRESS");
  if (!env.chain.hasPrivateKey) missing.push("DEPLOYER_PRIVATE_KEY");
  if (!env.storage.hasIndexerRpc) missing.push("OG_STORAGE_INDEXER_RPC");
  if (!env.storage.hasPrivateKey) missing.push("OG_STORAGE_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY");
  if (!env.compute.hasBaseUrl) missing.push("OG_COMPUTE_BASE_URL");
  if (!env.compute.hasApiKey) missing.push("OG_COMPUTE_API_KEY");
  if (!env.compute.hasModel) missing.push("OG_COMPUTE_MODEL");

  return missing;
}

