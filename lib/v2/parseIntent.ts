import { permissionIntentSchema, type ValidatedIntent } from "./intent";

// Turns the user's plain-English request into a structured, validated spending
// permission. Deterministic, no external AI: it reads the daily cap, per-charge
// cap, and expiry from common phrasings, then the zod schema (lib/v2/intent.ts)
// is the final authority on what is allowed to become an on-chain permission.

export type ParseResult =
  | { ok: true; intent: ValidatedIntent }
  | { ok: false; error: string };

export function parseIntent(prompt: string): ParseResult {
  const trimmed = prompt?.trim();
  if (!trimmed) return { ok: false, error: "Empty request." };

  const num = (re: RegExp): number | undefined => {
    const m = trimmed.match(re);
    const n = m ? Number(m[1]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  // "$20 a day", "20 USDC per day", "daily 20"
  const daily =
    num(/\$\s*(\d+(?:\.\d+)?)\s*(?:usdc\s*)?(?:a|per|\/)?\s*day/i) ??
    num(/(\d+(?:\.\d+)?)\s*usdc\s*(?:a|per|\/)?\s*day/i) ??
    num(/daily[^.\d]{0,12}\$?\s*(\d+(?:\.\d+)?)/i);

  // "$5 per charge", "5 per transaction", "each charge $5"
  const perCharge =
    num(/\$\s*(\d+(?:\.\d+)?)\s*(?:usdc\s*)?(?:per|a|each|\/)?\s*(?:charge|call|transaction|purchase|payment|tx)/i) ??
    num(/(?:per\s+(?:charge|call|transaction|purchase|payment)|each)[^.\d]{0,12}\$?\s*(\d+(?:\.\d+)?)/i);

  // "for 7 days", "expires in 30 days"
  const expiry = num(/(\d+)\s*days?\b/i);

  const dailyCapUsd = Math.min(daily ?? perCharge ?? 50, 10_000);
  const perCallCapUsd = Math.min(perCharge ?? daily ?? dailyCapUsd, dailyCapUsd);
  const expiresInDays = Math.min(Math.max(expiry ?? 7, 1), 30);
  const wantsSwap = /\b(swap|uniswap|trade|trading)\b/i.test(trimmed);

  // The same zod safety net the rest of the pipeline trusts. Nothing reaches the
  // chain without passing it, so the parser can never produce an out-of-bounds
  // permission.
  const parsed = permissionIntentSchema.safeParse({
    purpose: trimmed.slice(0, 100),
    token: "USDC",
    dailyCapUsd,
    perCallCapUsd,
    allowedTargets: wantsSwap ? ["uniswap-v3"] : ["x402"],
    expiresInDays
  });

  if (!parsed.success) {
    return { ok: false, error: `Invalid permission: ${parsed.error.issues[0]?.message}` };
  }
  return { ok: true, intent: parsed.data };
}
