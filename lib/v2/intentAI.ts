import { permissionIntentSchema, type ValidatedIntent } from "./intent";
import { parseIntent } from "./parseIntent";
import { askBrain, brainConfigured } from "./og/compute";

// AI-native intent understanding, powered by 0G Compute.
//
// The 0G-hosted model reads the user's plain-English request and returns a
// structured spending permission. The deterministic regex parser stays as a
// safe fallback for when the brain is not configured or is unreachable, and the
// zod schema (lib/v2/intent.ts) is ALWAYS the final authority — nothing reaches
// the chain without passing it, no matter where it came from.

export type UnderstoodIntent =
  | { ok: true; intent: ValidatedIntent; source: "0g-compute" | "fallback" }
  | { ok: false; error: string; source: "0g-compute" | "fallback" };

const SYSTEM_PROMPT = `You are the brain of AgiCards, a tool that gives an AI agent a safe, capped spending card.
Convert the user's plain-English request into a spending permission.

Reply with ONLY a JSON object (no markdown fences, no explanation) with EXACTLY these fields:
- "purpose": a short string (max 100 characters) describing what the card is for
- "dailyCapUsd": number, the most the agent may spend per day in US dollars (max 10000)
- "perCallCapUsd": number, the most for a single payment in US dollars; must be less than or equal to dailyCapUsd
- "allowedTargets": an array. Use ["uniswap-v3"] if the request is about swapping or trading tokens; otherwise use ["x402"] for paying for services, APIs, compute, or subscriptions
- "expiresInDays": a whole number between 1 and 30

If the user does not give a number, choose a small, safe default (for example dailyCapUsd 5, perCallCapUsd 1, expiresInDays 7). Prefer smaller caps when unsure, to keep the user safe.`;

export async function understandIntent(prompt: string): Promise<UnderstoodIntent> {
  const trimmed = prompt?.trim();
  if (!trimmed) return { ok: false, error: "Empty request.", source: "fallback" };

  // Primary path: the 0G Compute brain understands the request.
  if (brainConfigured()) {
    try {
      const reply = await askBrain([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed }
      ]);
      const json = extractJson(reply) as Record<string, unknown>;
      const parsed = permissionIntentSchema.safeParse({ token: "USDC", ...json });
      if (parsed.success) {
        return { ok: true, intent: parsed.data, source: "0g-compute" };
      }
      // The brain produced an out-of-bounds or malformed permission. Fall back
      // to the deterministic parser rather than fail the request.
    } catch {
      // Brain unreachable or returned a bad response. Fall back safely.
    }
  }

  // Fallback path: deterministic parser (also validated by the same schema).
  const fallback = parseIntent(trimmed);
  return fallback.ok
    ? { ok: true, intent: fallback.intent, source: "fallback" }
    : { ok: false, error: fallback.error, source: "fallback" };
}

// Models sometimes wrap JSON in prose or ```json fences. Grab the first {...}.
function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in the brain's reply.");
  return JSON.parse(match[0]);
}
