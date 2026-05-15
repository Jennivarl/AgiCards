import { evaluateRequest } from "../policyEngine";
import type { CardRequest, RiskReport, SpendingPolicy, WalletState } from "../types";

export class OgComputeAdapter {
  async evaluate(
    request: Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode">,
    policy: SpendingPolicy,
    wallet: WalletState
  ): Promise<RiskReport> {
    return evaluateRequest(request, policy, wallet);
  }
}

export const ogCompute = new OgComputeAdapter();

