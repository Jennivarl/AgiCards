import { z } from "zod";

// The ONLY places an AgiCard agent may ever spend. Venice produces these KEYS;
// the actual on-chain addresses are resolved server-side in Phase 3. The LLM can
// never introduce a target outside this list — that is the anti-prompt-injection
// guarantee.
export const TARGET_KEYS = ["x402", "uniswap-v3"] as const;
export type TargetKey = (typeof TARGET_KEYS)[number];

export const TARGET_LABELS: Record<TargetKey, string> = {
  "x402": "Pay-per-use APIs & services (x402)",
  "uniswap-v3": "Token swaps on Uniswap V3"
};

// The zod schema is the hard safety net between the LLM and the chain. Anything
// Venice returns that doesn't fit these bounds is rejected before it can become
// an on-chain permission.
export const permissionIntentSchema = z
  .object({
    purpose: z.string().min(1).max(100),
    token: z.literal("USDC"),
    dailyCapUsd: z.number().positive().max(10_000),
    perCallCapUsd: z.number().positive().max(10_000),
    allowedTargets: z.array(z.enum(TARGET_KEYS)).min(1),
    expiresInDays: z.number().int().min(1).max(30)
  })
  .refine((v) => v.perCallCapUsd <= v.dailyCapUsd, {
    message: "perCallCapUsd cannot exceed dailyCapUsd",
    path: ["perCallCapUsd"]
  });

export type ValidatedIntent = z.infer<typeof permissionIntentSchema>;
