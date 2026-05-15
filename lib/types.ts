export type SpendMode = "stripe" | "web3";
export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "completed";
export type RiskDecision = "approved" | "rejected" | "requires_human_approval";

export type AgentProfile = {
  id: string;
  name: string;
  purpose: string;
  owner: string;
  storageRoot: string;
  memoryRoot: string;
  status: "active" | "paused";
};

export type SpendingPolicy = {
  id: string;
  agentId: string;
  name: string;
  maxPerRequestUsd: number;
  dailyLimitUsd: number;
  autoApproveBelowUsd: number;
  allowedCategories: string[];
  expiresInHours: number;
  storageRoot: string;
};

export type WalletState = {
  depositedUsd: number;
  reservedUsd: number;
  spentUsd: number;
  depositReceiptRoot: string;
};

export type CardRequest = {
  id: string;
  agentId: string;
  policyId: string;
  mode: SpendMode;
  merchant: string;
  category: string;
  purpose: string;
  amountUsd: number;
  status: RequestStatus;
  requestRoot: string;
  decisionRoot?: string;
  receiptRoot?: string;
  providerCardId?: string;
  last4?: string;
  risk?: RiskReport;
};

export type RiskReport = {
  decision: RiskDecision;
  riskScore: number;
  reason: string;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
};

export type StorageObject = {
  root: string;
  type: "agent" | "policy" | "memory" | "request" | "receipt" | "deposit" | "decision";
  createdAt: string;
  payload: unknown;
};

export type StripeCardMetadata = {
  provider: "stripe";
  cardId: string;
  cardholderId: string;
  brand: "visa" | "mastercard";
  last4: string;
  status: "active" | "inactive" | "cancelled";
  spendingLimitUsd: number;
};

export type Web3CardMetadata = {
  provider: "0g-web3";
  cardId: string;
  status: "active" | "spent" | "cancelled";
  spendingLimitUsd: number;
};

