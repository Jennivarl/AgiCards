import { evaluateRequest } from "../policyEngine";
import type { CardRequest, RiskReport, SpendingPolicy, WalletState } from "../types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OgComputeAdapter {
  private readonly baseUrl = process.env.OG_COMPUTE_BASE_URL || "https://router-api.0g.ai/v1";
  private readonly apiKey = process.env.OG_COMPUTE_API_KEY;
  private readonly model = process.env.OG_COMPUTE_MODEL || "OGM-1.0-35B-A3B";
  private readonly fallbackModel = process.env.OG_COMPUTE_FALLBACK_MODEL || "deepseek-v4-pro";

  status() {
    return {
      configured: Boolean(this.apiKey),
      baseUrl: this.baseUrl,
      model: this.model,
      fallbackModel: this.fallbackModel
    };
  }

  async evaluate(
    request: Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode">,
    policy: SpendingPolicy,
    wallet: WalletState
  ): Promise<RiskReport> {
    const fallback = evaluateRequest(request, policy, wallet);

    if (!this.apiKey) {
      return fallback;
    }

    try {
      return await this.evaluateWithRouter(this.model, request, policy, wallet, fallback);
    } catch (error) {
      console.warn("Primary 0G Compute evaluation failed; trying fallback model.", error);
    }

    try {
      return await this.evaluateWithRouter(this.fallbackModel, request, policy, wallet, fallback);
    } catch (error) {
      console.warn("Fallback 0G Compute evaluation failed; falling back to local policy engine.", error);
      return {
        ...fallback,
        reason: `${fallback.reason} Remote compute was unavailable, so AgiCards used the deterministic policy engine.`
      };
    }
  }

  private async evaluateWithRouter(
    model: string,
    request: Pick<CardRequest, "amountUsd" | "category" | "merchant" | "purpose" | "mode">,
    policy: SpendingPolicy,
    wallet: WalletState,
    fallback: RiskReport
  ): Promise<RiskReport> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are AgiCards risk compute. Return only strict JSON matching: {\"decision\":\"approved|rejected|requires_human_approval\",\"riskScore\":number,\"reason\":\"short reason\"}."
          },
          {
            role: "user",
            content: JSON.stringify({
              request,
              policy,
              wallet,
              deterministicPolicyResult: fallback
            })
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`0G Compute Router returned ${response.status}`);
    }

    const completion = (await response.json()) as ChatCompletionResponse;
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("0G Compute Router returned no message content.");
    }

    const parsed = JSON.parse(stripJsonFence(content)) as Partial<RiskReport>;

    return {
      decision: parsed.decision ?? fallback.decision,
      riskScore: typeof parsed.riskScore === "number" ? parsed.riskScore : fallback.riskScore,
      reason: parsed.reason || fallback.reason,
      checks: fallback.checks
    };
  }
}

export const ogCompute = new OgComputeAdapter();

function stripJsonFence(content: string) {
  return content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}
