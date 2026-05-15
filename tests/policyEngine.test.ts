import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateRequest } from "../lib/policyEngine";
import type { SpendingPolicy, WalletState } from "../lib/types";

const policy: SpendingPolicy = {
  id: "policy_test",
  agentId: "agent_test",
  name: "Test Policy",
  maxPerRequestUsd: 25,
  dailyLimitUsd: 100,
  autoApproveBelowUsd: 10,
  allowedCategories: ["SaaS", "AI tools"],
  expiresInHours: 24,
  storageRoot: "0xpolicy"
};

const wallet: WalletState = {
  depositedUsd: 100,
  reservedUsd: 0,
  spentUsd: 0,
  depositReceiptRoot: "0xdeposit"
};

describe("policy engine", () => {
  it("approves a valid low-risk request", () => {
    const result = evaluateRequest(
      {
        mode: "web3",
        merchant: "AI Landing Reviewer",
        category: "AI tools",
        amountUsd: 7,
        purpose: "Review landing page before launch"
      },
      policy,
      wallet
    );

    assert.equal(result.decision, "approved");
  });

  it("requires human approval above the auto-approval threshold", () => {
    const result = evaluateRequest(
      {
        mode: "web3",
        merchant: "AI Research Pro",
        category: "AI tools",
        amountUsd: 18,
        purpose: "Buy temporary research credits"
      },
      policy,
      wallet
    );

    assert.equal(result.decision, "requires_human_approval");
  });

  it("rejects blocked categories", () => {
    const result = evaluateRequest(
      {
        mode: "web3",
        merchant: "Hotel Booking",
        category: "Travel",
        amountUsd: 7,
        purpose: "Book travel for a meeting"
      },
      policy,
      wallet
    );

    assert.equal(result.decision, "rejected");
  });

  it("rejects requests without enough available funds", () => {
    const result = evaluateRequest(
      {
        mode: "web3",
        merchant: "AI Landing Reviewer",
        category: "AI tools",
        amountUsd: 20,
        purpose: "Review landing page before launch"
      },
      policy,
      {
        ...wallet,
        depositedUsd: 10
      }
    );

    assert.equal(result.decision, "rejected");
  });
});

