import { encodeFunctionData, erc20Abi, parseUnits, type Address, type Hex } from "viem";
import {
  createDelegation,
  signDelegation,
  getSmartAccountsEnvironment,
  ScopeType
} from "@metamask/smart-accounts-kit";
import { decodeDelegations } from "@metamask/smart-accounts-kit/utils";
import { V2_CHAIN } from "./chains";
import { USDC_ADDRESS, USDC_DECIMALS } from "./tokens";
import type { AgiCard } from "./types";
import type { SkillCall } from "./skills/types";
import type { TransportResult } from "./transport";

// ─────────────────────────────────────────────────────────────────────────────
// 1Shot permissionless gasless relayer (EIP-7710), adapted for an AUTONOMOUS
// agent. 1Shot's own examples assume the user signs a fresh delegation at the
// moment of payment; AgiCards' agent acts while the user is OFFLINE, so the
// agent RE-DELEGATES the user's card permission to 1Shot's redeemer and signs
// that re-delegation with its own (server-side) key.
//
// Flow (verified against the 1Shot OpenRPC spec + their public-relayer skill):
//   1. relayer_getCapabilities -> redeemer (targetAddress) + fee collector
//   2. relayer_getFeeData       -> the minimum stablecoin fee
//   3. build [fee transfer, work] executions; agent re-delegates scoped to
//      (fee + work) USDC and signs it
//   4. relayer_estimate7710Transaction -> exact fee + a signed price quote;
//      if the fee changed, re-sign + re-estimate
//   5. relayer_send7710Transaction (with the quote) -> TaskId
//   6. relayer_getStatus poll -> 200 confirmed / 400 / 500
//
// ✓ LIVE-CONFIRMED on Base mainnet: a real gasless send completed with the agent
// holding zero ETH — 1Shot's relayer paid the gas, the fee was paid in USDC from
// the card, and the agent re-delegation redeemed on-chain (tx
// 0xfceea8ff67f94b32b05689f7c0cb196694f84037a1b6a3abbfc02fb6f87c9f66).
// Turn it on with EXECUTION_TRANSPORT="1shot".
// ─────────────────────────────────────────────────────────────────────────────

const RELAYER_URL =
  process.env.ONESHOT_RELAYER_URL || "https://relayer.1shotapi.com/relayers";

type ChainCaps = { feeCollector: Address; targetAddress: Address };
type FeeData = { minFee: string; token: { address: Address; decimals: number } };
type EstimateResult = {
  success: boolean;
  context?: string;
  requiredPaymentAmount?: string;
  error?: string;
};
type StatusResult = { status: number; receipt?: { transactionHash?: Hex }; message?: string };

// JSON-RPC call. params is passed through as-is (an object for the 7710 methods,
// a positional array for getCapabilities). bigints + byte arrays become
// JSON-safe hex, as 1Shot requires.
async function rpc<T>(method: string, params: unknown): Promise<T> {
  const res = await fetch(RELAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }, (_k, v) => {
      if (typeof v === "bigint") return `0x${v.toString(16)}`;
      if (v instanceof Uint8Array) return `0x${Buffer.from(v).toString("hex")}`;
      return v;
    })
  });
  if (!res.ok) throw new Error(`1Shot ${method} HTTP ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message?: string } };
  if (json.error) throw new Error(`1Shot ${method}: ${json.error.message ?? "rpc error"}`);
  return json.result as T;
}

export async function relayViaOneShot(call: SkillCall, card: AgiCard): Promise<TransportResult> {
  const chainId = V2_CHAIN.id;
  const chainKey = String(chainId);

  const agentKey = process.env.AGENT_LOCAL_PRIVATE_KEY as Hex | undefined;
  if (!agentKey) {
    throw new Error("1Shot needs AGENT_LOCAL_PRIVATE_KEY to sign the agent re-delegation.");
  }

  // 1) Capabilities: 1Shot's redeemer address + where the fee is collected.
  const caps = await rpc<Record<string, ChainCaps>>("relayer_getCapabilities", [chainKey]);
  const chainCaps = caps[chainKey];
  if (!chainCaps) throw new Error(`1Shot does not support chain ${chainKey}.`);

  // 2) Fee data: the minimum USDC fee to start from. 1Shot returns minFee as a
  // DECIMAL token amount (e.g. "0.01" USDC), not atoms — confirmed live.
  const feeData = await rpc<FeeData>("relayer_getFeeData", { chainId: chainKey, token: USDC_ADDRESS });
  const minFee = parseUnits(String(feeData.minFee), feeData.token.decimals);

  // The real work the agent wants to do (e.g. the x402 USDC transfer).
  const workExecution = { target: call.to, value: call.value, data: call.data };
  // USDC the work moves, so the re-delegation scope can cover (fee + work).
  const workAmount = parseUnits(String(call.amountUsd), USDC_DECIMALS);

  // Build a fully-signed bundle for a given fee amount.
  const buildBundle = async (feeAmount: bigint) => {
    const feeExecution = {
      target: USDC_ADDRESS,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [chainCaps.feeCollector, feeAmount]
      })
    };

    // Agent re-delegates the user's card permission to 1Shot's redeemer, scoped
    // to exactly (fee + work) USDC, and signs it with the agent's own key.
    const redelegation = createDelegation({
      environment: getSmartAccountsEnvironment(chainId),
      from: card.delegate,
      to: chainCaps.targetAddress,
      parentPermissionContext: card.permissionsContext,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: USDC_ADDRESS,
        maxAmount: feeAmount + workAmount
      }
    });
    const signature = await signDelegation({
      privateKey: agentKey,
      delegation: redelegation,
      delegationManager: card.delegationManager,
      chainId
    });
    const signedRedelegation = { ...redelegation, signature };

    // Delegation chain: leaf (agent -> 1Shot redeemer) FIRST, then the parent
    // user delegation(s). Confirmed live — the relayer requires the first
    // delegation's delegate to be its Target wallet, which is this re-delegation.
    const permissionContext = [
      signedRedelegation,
      ...decodeDelegations(card.permissionsContext)
    ];

    return {
      chainId: chainKey,
      transactions: [{ permissionContext, executions: [feeExecution, workExecution] }]
    };
  };

  // 3-4) Estimate with the minimum fee, then re-sign + re-estimate if the
  // relayer wants a different amount.
  let bundle = await buildBundle(minFee);
  let estimate = await rpc<EstimateResult>("relayer_estimate7710Transaction", bundle);
  if (!estimate.success) throw new Error(`1Shot estimate failed: ${estimate.error ?? "unknown"}`);

  const required = BigInt(estimate.requiredPaymentAmount ?? "0");
  if (required > minFee) {
    bundle = await buildBundle(required);
    estimate = await rpc<EstimateResult>("relayer_estimate7710Transaction", bundle);
    if (!estimate.success) throw new Error(`1Shot re-estimate failed: ${estimate.error ?? "unknown"}`);
  }

  // 5) Send with the signed price quote.
  const taskId = await rpc<string>("relayer_send7710Transaction", {
    ...bundle,
    context: estimate.context,
    destinationUrl: process.env.PUBLIC_WEBHOOK_URL || undefined
  });
  if (typeof taskId !== "string") throw new Error("1Shot send did not return a TaskId.");

  // 6) Poll until terminal.
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const s = await rpc<StatusResult>("relayer_getStatus", { id: taskId, logs: false });
    if (s.status === 200) return { status: "confirmed", txHash: s.receipt?.transactionHash, taskId };
    if (s.status === 400 || s.status === 500) return { status: "reverted", taskId };
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { status: "relaying", taskId };
}
