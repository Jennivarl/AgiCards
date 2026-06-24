import { createWalletClient, http, type Hex } from "viem";
import { erc7710WalletActions } from "@metamask/smart-accounts-kit/actions";
import { decodeDelegations } from "@metamask/smart-accounts-kit/utils";
import { V2_CHAIN, RPC_URL, publicClient } from "./chains";
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

// Production GASLESS path: the 1Shot permissionless relayer redeems the card's
// delegation and sponsors gas, paid in a stablecoin taken from the bundle (so the
// agent never needs ETH). Built against the 1Shot OpenRPC spec:
//   1. relayer_estimate7710Transaction -> gas fee (in a stablecoin) + signed quote
//   2. relayer_send7710Transaction (executions + quote)             -> TaskId
//   3. relayer_getStatus (poll)  -> 200 confirmed / 400 rejected / 500 reverted
//
// NOT the default and NOT yet live-tested. Two things to confirm on a real run
// (kept as TODOs below): whether the gas fee must be added as an explicit
// stablecoin-transfer execution, and the exact JSON-RPC param framing. Keep
// EXECUTION_TRANSPORT="wallet" until a tiny-amount mainnet test passes.
class OneShotRelayerTransport implements ExecutionTransport {
  readonly kind = "1shot" as const;
  private readonly endpoint =
    process.env.ONESHOT_RELAYER_URL || "https://relayer.1shotapi.com/relayers";

  async submit(call: SkillCall, card: AgiCard): Promise<TransportResult> {
    const chainId = String(V2_CHAIN.id);

    // 1Shot wants the DECODED delegation chain, not the encoded hex the card stores.
    const permissionContext = decodeDelegations(card.permissionsContext);
    const executions = [{ target: call.to, value: call.value, data: call.data }];
    const transactions = [{ permissionContext, executions }];

    // 1) Estimate -> required gas fee (in a stablecoin) + a signed price quote.
    const estimate = await this.rpc<{
      success: boolean;
      context?: string;
      requiredPaymentAmount?: string;
      paymentTokenAddress?: string;
      error?: string;
    }>("relayer_estimate7710Transaction", { chainId, transactions });
    if (!estimate?.success) {
      throw new Error(`1Shot estimate failed: ${estimate?.error ?? "unknown error"}`);
    }
    // TODO(1shot): if a live run shows the relayer needs the gas fee as an explicit
    // execution, append a stablecoin transfer of estimate.requiredPaymentAmount
    // (token estimate.paymentTokenAddress) to `executions` before sending.

    // 2) Send with the signed quote -> TaskId.
    const taskId = await this.rpc<string>("relayer_send7710Transaction", {
      chainId,
      transactions,
      context: estimate.context,
      destinationUrl: process.env.PUBLIC_WEBHOOK_URL || undefined
    });
    if (typeof taskId !== "string") throw new Error("1Shot send did not return a TaskId.");

    // 3) Poll until terminal.
    return await this.pollStatus(taskId);
  }

  // JSON-RPC call. bigints (e.g. a delegation salt, an execution value) become
  // JSON-safe hex, as the 1Shot docs require.
  private async rpc<T>(method: string, params: unknown): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        { jsonrpc: "2.0", id: 1, method, params: [params] },
        (_k, v) => (typeof v === "bigint" ? `0x${v.toString(16)}` : v)
      )
    });
    if (!res.ok) throw new Error(`1Shot ${method} HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { message?: string } };
    if (json.error) throw new Error(`1Shot ${method}: ${json.error.message ?? "rpc error"}`);
    return json.result as T;
  }

  // Poll relayer_getStatus until the relay reaches a terminal state.
  private async pollStatus(taskId: string): Promise<TransportResult> {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const s = await this.rpc<{ status: number; receipt?: { transactionHash?: Hex } }>(
        "relayer_getStatus",
        { id: taskId, logs: false }
      );
      if (s?.status === 200) return { status: "confirmed", txHash: s.receipt?.transactionHash, taskId };
      if (s?.status === 400 || s?.status === 500) return { status: "reverted", taskId };
      await new Promise((r) => setTimeout(r, 2500));
    }
    return { status: "relaying", taskId };
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
