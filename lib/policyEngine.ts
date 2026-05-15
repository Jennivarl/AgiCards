import type { CardRequest, RiskReport, SpendingPolicy, WalletState } from "./types";

export function availableWalletBalance(wallet: WalletState) {
  return wallet.depositedUsd - wallet.reservedUsd - wallet.spentUsd;
}

export function evaluateRequest(
  request: Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode">,
  policy: SpendingPolicy,
  wallet: WalletState
): RiskReport {
  const checks = [
    {
      label: "Funding",
      passed: availableWalletBalance(wallet) >= request.amountUsd,
      detail: `Available balance is $${availableWalletBalance(wallet).toFixed(2)}.`
    },
    {
      label: "Per-request limit",
      passed: request.amountUsd <= policy.maxPerRequestUsd,
      detail: `Request is $${request.amountUsd.toFixed(2)} of $${policy.maxPerRequestUsd.toFixed(2)} allowed.`
    },
    {
      label: "Daily limit",
      passed: wallet.spentUsd + wallet.reservedUsd + request.amountUsd <= policy.dailyLimitUsd,
      detail: `Projected daily usage is $${(wallet.spentUsd + wallet.reservedUsd + request.amountUsd).toFixed(2)}.`
    },
    {
      label: "Category",
      passed: policy.allowedCategories.includes(request.category),
      detail: `${request.category} ${policy.allowedCategories.includes(request.category) ? "is" : "is not"} allowed.`
    },
    {
      label: "Purpose",
      passed: request.purpose.trim().length >= 12,
      detail: "Agent must provide a meaningful spending reason."
    }
  ];

  const failedChecks = checks.filter((check) => !check.passed);
  const overAutoApproval = request.amountUsd > policy.autoApproveBelowUsd;
  const riskScore = Math.min(
    100,
    failedChecks.length * 30 + (overAutoApproval ? 18 : 0) + (request.mode === "stripe" ? 10 : 0)
  );

  if (failedChecks.length > 0) {
    return {
      decision: "rejected",
      riskScore,
      reason: `Rejected because ${failedChecks.map((check) => check.label.toLowerCase()).join(", ")} failed.`,
      checks
    };
  }

  if (overAutoApproval) {
    return {
      decision: "requires_human_approval",
      riskScore,
      reason: "The request matches policy, but it is above the auto-approval threshold.",
      checks
    };
  }

  return {
    decision: "approved",
    riskScore,
    reason: `Approved for ${request.merchant}. It matches policy and is below auto-approval.`,
    checks
  };
}

export function reserveFunds(wallet: WalletState, amountUsd: number): WalletState {
  return {
    ...wallet,
    reservedUsd: wallet.reservedUsd + amountUsd
  };
}

export function settleReservedSpend(wallet: WalletState, amountUsd: number): WalletState {
  return {
    ...wallet,
    reservedUsd: Math.max(0, wallet.reservedUsd - amountUsd),
    spentUsd: wallet.spentUsd + amountUsd
  };
}

export function releaseReservedFunds(wallet: WalletState, amountUsd: number): WalletState {
  return {
    ...wallet,
    reservedUsd: Math.max(0, wallet.reservedUsd - amountUsd)
  };
}

