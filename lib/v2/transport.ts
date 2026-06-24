import { createWalletClient, http, type Hex } from "viem";
import { erc7710WalletActions } from "@metamask/smart-accounts-kit/actions";
import { V2_CHAIN, RPC_URL, publicClient } from "./chains";
import { relayViaOneShot } from "./oneshot";
import { getAgentSigner } from "./signer";
import type { AgiCard } from "./types";
import type { SkillCall } from "./skills/types";

export type TransportResult = {
  status: "confirmed" | "reverted" | "relaying";
  txHash?: Hex;
  taskId?: string;
};

// How a skill call actually reaches the chain. Pluggable so the demo runs
// without funds while the real on-chain / gasless paths slot in unchanged.
export interface ExecutionTransport {
  readonly kind: "simulated" | "wallet" | "1shot";
  submit(call: SkillCall, card: AgiCard): Promise<TransportResult>;
}

// Demo transport: proves the full pipeline (cap checks -> audit log -> budget
// update) without a funded session account or live relayer. Clearly labeled.
class SimulatedTransport implements ExecutionTransport {
  readonly kind = "simulated" as const;
  async submit(call: SkillCall): Promise<TransportResult> {
    const seed = `${call.to}:${call.amountUsd}:${Date.now()}`;
    const txHash = `0x${Buffer.from(seed)
      .toString("hex")
      .padEnd(64, "0")
      .slice(0, 64)}` as Hex;
    return { status: "confirmed", txHash };
  }
}

// Production GASLESS path: 1Shot permissionless relayer (EIP-7710). The agent
// re-delegates the card permission to 1Shot's redeemer and pays gas in USDC from
// the bundle, so it never needs ETH. The full flow lives in ./oneshot.ts.
//
// NOT yet live-tested — keep EXECUTION_TRANSPORT="wallet" until a tiny mainnet
// run confirms the delegation chain order (see the note in ./oneshot.ts).
class OneShotRelayerTransport implements ExecutionTransport {
  readonly kind = "1shot" as const;
  submit(call: SkillCall, card: AgiCard): Promise<TransportResult> {
    return relayViaOneShot(call, card);
  }
}

// Real on-chain redemption: the agent's EOA (the card's delegate) sends a
// transaction that redeems the delegation, executing the skill call on the
// user's behalf within the on-chain caveat. The EOA pays its own gas in ETH, so
// it must be funded (and stable via AGENT_LOCAL_PRIVATE_KEY). No bundler needed.
class WalletTransport implements ExecutionTransport {
  readonly kind = "wallet" as const;
  async submit(call: SkillCall, card: AgiCard): Promise<TransportResult> {
    const account = await getAgentSigner().getAccount(card.id);
    const walletClient = createWalletClient({
      account,
      chain: V2_CHAIN,
      transport: http(RPC_URL)
    }).extend(erc7710WalletActions());

    const txHash = await walletClient.sendTransactionWithDelegation({
      account,
      chain: V2_CHAIN,
      to: call.to,
      data: call.data,
      value: call.value,
      permissionContext: card.permissionsContext,
      delegationManager: card.delegationManager
    });

    // Wait for the receipt so "confirmed" means actually mined, and a reverted
    // redemption is reported as such instead of being counted as a spend.
    const receipt = await publicClient().waitForTransactionReceipt({ hash: txHash });
    return {
      status: receipt.status === "success" ? "confirmed" : "reverted",
      txHash
    };
  }
}

export function getTransport(): ExecutionTransport {
  const choice = (process.env.EXECUTION_TRANSPORT || "").toLowerCase();
  if (choice === "wallet") return new WalletTransport();
  if (choice === "1shot") return new OneShotRelayerTransport();
  return new SimulatedTransport();
}
