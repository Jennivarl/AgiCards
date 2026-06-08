import type { Hex } from "viem";
import { V2_CHAIN } from "./chains";
import type { AgiCard } from "./types";
import type { SkillCall } from "./skills/types";

export type TransportResult = {
  status: "confirmed" | "reverted" | "relaying";
  txHash?: Hex;
  taskId?: string;
};

// How a skill call actually reaches the chain. Pluggable so the demo runs
// without funds while the production gasless path slots in unchanged.
export interface ExecutionTransport {
  readonly kind: "simulated" | "1shot";
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

// Production gasless path: the 1Shot permissionless relayer redeems the card's
// delegation and sponsors gas. JSON-RPC per 1Shot docs; exact fee/field mapping
// should be validated against a live relayer run before mainnet.
class OneShotRelayerTransport implements ExecutionTransport {
  readonly kind = "1shot" as const;
  private readonly endpoint =
    process.env.ONESHOT_RELAYER_URL || "https://relayer.1shotapi.com/relayers";

  async submit(call: SkillCall, card: AgiCard): Promise<TransportResult> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "relayer_send7710Transaction",
        params: {
          chainId: String(V2_CHAIN.id),
          transactions: [
            { to: call.to, data: call.data, value: call.value.toString() }
          ],
          delegationContext: card.permissionsContext,
          destinationUrl: process.env.PUBLIC_WEBHOOK_URL
        }
      })
    });
    if (!res.ok) throw new Error(`1Shot relayer returned ${res.status}`);
    const json = (await res.json()) as { result?: { TaskId?: string; taskId?: string } };
    return { status: "relaying", taskId: json.result?.TaskId ?? json.result?.taskId };
  }
}

export function getTransport(): ExecutionTransport {
  if ((process.env.EXECUTION_TRANSPORT || "").toLowerCase() === "1shot") {
    return new OneShotRelayerTransport();
  }
  return new SimulatedTransport();
}
