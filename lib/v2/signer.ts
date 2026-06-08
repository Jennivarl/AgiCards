import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Account, Hex } from "viem";

// The agent's "session key" — the thing that redeems an AgiCard's delegation to
// execute transactions on the user's behalf. Because the agent runs in the
// BACKGROUND (24/7, user offline), this key lives server-side, NOT in the
// browser. That is "Option B": always-on, production.
//
// This is a swappable interface. Today: a managed-wallet service (Turnkey /
// Privy) issuing one isolated key PER CARD, so a leak blasts one card, not the
// user's whole account. A local env key is provided for dev/testnet only.
export interface AgentSigner {
  readonly kind: "local" | "turnkey" | "privy";
  /** Returns a viem Account for a given card's session key. */
  getAccount(cardId: string): Promise<Account>;
}

// --- Dev/testnet only: single private key from env. NOT production-safe. ---
class LocalKeyAgentSigner implements AgentSigner {
  readonly kind = "local" as const;
  private readonly key: Hex;

  constructor(key: Hex) {
    this.key = key;
  }

  async getAccount(_cardId: string): Promise<Account> {
    // One shared key for every card — fine for a throwaway testnet key, never
    // for real funds. Managed signers below isolate keys per card.
    return privateKeyToAccount(this.key);
  }
}

// --- Production: per-card isolated keys held by a managed wallet service. ---
// Implement against Turnkey or Privy server wallets. Each call resolves (or
// lazily creates) a wallet scoped to `cardId` and returns a viem-compatible
// Account that signs via the provider's API — raw key never touches our infra.
class ManagedAgentSigner implements AgentSigner {
  readonly kind: "turnkey" | "privy";
  constructor(kind: "turnkey" | "privy") {
    this.kind = kind;
  }
  async getAccount(_cardId: string): Promise<Account> {
    throw new Error(
      `${this.kind} signer not configured yet. Set the provider keys and ` +
        `implement getAccount to return a per-card managed Account.`
    );
  }
}

let cached: AgentSigner | null = null;

export function getAgentSigner(): AgentSigner {
  if (cached) return cached;

  const provider = (process.env.AGENT_SIGNER_PROVIDER || "local").toLowerCase();

  if (provider === "turnkey" || provider === "privy") {
    cached = new ManagedAgentSigner(provider);
    return cached;
  }

  const key = process.env.AGENT_LOCAL_PRIVATE_KEY as Hex | undefined;
  if (key) {
    cached = new LocalKeyAgentSigner(key);
    return cached;
  }

  // Dev convenience: no key set -> generate an ephemeral one so the flow works
  // with zero config. Cards minted to it won't survive a server restart. NEVER
  // rely on this in production — set a managed signer instead.
  console.warn(
    "[agent-signer] No AGENT_LOCAL_PRIVATE_KEY set; using an ephemeral dev key."
  );
  cached = new LocalKeyAgentSigner(generatePrivateKey());
  return cached;
}
