import type { AgentProfile, CardRequest, SpendingPolicy, WalletState } from "./types";

export const demoWallet: WalletState = {
  depositedUsd: 100,
  reservedUsd: 0,
  spentUsd: 0,
  depositReceiptRoot: "0x7c6a7c0c8a3e0b2380a3e8d9a47e48f7754ed7ac0c6f0478c89c05f6f7d2a100"
};

export const demoAgent: AgentProfile = {
  id: "agent_marketing",
  name: "Marketing Agent",
  purpose: "Research SaaS tools, buy small growth services, and keep spending inside founder-defined rules.",
  owner: "0xAgiCardsDemoOwner",
  storageRoot: "0x1b4fd83600d02487ba4f3e54b58a2603dfaa3d87b56db7bc0d8e571c9986f001",
  memoryRoot: "0xd57d834c19cb652c5f0671142988e34d34bc70f735f3f46d6ac152803f40a642",
  status: "active"
};

export const demoPolicy: SpendingPolicy = {
  id: "policy_saas_growth",
  agentId: demoAgent.id,
  name: "SaaS Growth Card Policy",
  maxPerRequestUsd: 25,
  dailyLimitUsd: 100,
  autoApproveBelowUsd: 10,
  allowedCategories: ["SaaS", "AI tools", "Marketing"],
  expiresInHours: 24,
  storageRoot: "0x9b06f64501ef466c74ded2cfa3d5cc5fbc36a2d4f8b7048d3f37e6bb42b9b9aa"
};

export const initialRequests: CardRequest[] = [
  {
    id: "req_caption_tool",
    agentId: demoAgent.id,
    policyId: demoPolicy.id,
    mode: "web3",
    merchant: "AI Caption Studio",
    category: "AI tools",
    purpose: "Generate ad captions for the product launch",
    amountUsd: 7,
    status: "approved",
    requestRoot: "0x1881c450f63d1343cdfaf3c573238610ff62bd17ef8973b72f2fc88a75c7611c",
    decisionRoot: "0x7fb3f0d07bbf05bd2d0fdfd2044a2b08998f38bcc048b9e98de3d5961f65f583",
    receiptRoot: "0x8ca16a496a5228ef9c48b4be8ee13177ff3a02d4ac91eaef128a1eeb8f239ea6",
    risk: {
      decision: "approved",
      riskScore: 12,
      reason: "The request is below auto-approval and matches the AI tools category.",
      checks: [
        { label: "Category", passed: true, detail: "AI tools is allowed." },
        { label: "Amount", passed: true, detail: "$7 is below the $25 request limit." },
        { label: "Funding", passed: true, detail: "Wallet has enough available funds." }
      ]
    }
  }
];

