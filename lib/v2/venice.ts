import {
  permissionIntentSchema,
  TARGET_KEYS,
  TARGET_LABELS,
  type ValidatedIntent
} from "./intent";

// Venice AI turns the user's plain-English request into a structured permission.
// It is OpenAI-compatible, so this mirrors the existing 0G compute adapter.
// Crucially: Venice only proposes — the zod schema (lib/v2/intent.ts) decides.

const SYSTEM_PROMPT = `You convert a user's plain-English request into a strict JSON spending permission for an AI agent card.
Return ONLY a JSON object with exactly these fields:
{ "purpose": string, "token": "USDC", "dailyCapUsd": number, "perCallCapUsd": number, "allowedTargets": string[], "expiresInDays": integer }
Rules:
- "token" must be "USDC".
- "allowedTargets" may ONLY contain these keys: ${TARGET_KEYS.map((k) => `"${k}" (${TARGET_LABELS[k]})`).join(", ")}.
- Never invent addresses, tokens, or target keys outside that list.
- "perCallCapUsd" must be <= "dailyCapUsd".
- "expiresInDays" is an integer between 1 and 30.
- Choose sensible defaults if the user is vague (e.g. perCallCapUsd = dailyCapUsd, expiresInDays = 7).`;

export type ParseResult =
  | { ok: true; intent: ValidatedIntent; mode: "venice" | "fallback" }
  | { ok: false; error: string };

export async function parseIntent(prompt: string): Promise<ParseResult> {
  const trimmed = prompt?.trim();
  if (!trimmed) return { ok: false, error: "Empty request." };

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    // No key: deterministic fallback so the prompt bar still works in dev.
    return fallbackParse(trimmed);
  }

  try {
    const raw = await callVenice(trimmed, apiKey);
    const parsed = permissionIntentSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: `Invalid permission: ${parsed.error.issues[0]?.message}` };
    }
    return { ok: true, intent: parsed.data, mode: "venice" };
  } catch (e) {
    console.warn("Venice intent parse failed; using fallback.", e);
    return fallbackParse(trimmed);
  }
}

async function callVenice(prompt: string, apiKey: string): Promise<unknown> {
  const baseUrl = process.env.VENICE_BASE_URL || "https://api.venice.ai/api/v1";
  const model = process.env.VENICE_MODEL || "venice-uncensored";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) throw new Error(`Venice returned ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Venice returned no content.");
  return JSON.parse(stripJsonFence(content));
}

// Deterministic parser for the no-key path. Reads daily cap, per-charge cap, and
// expiry from common phrasings — accurate enough that the preview looks polished
// without any AI call.
function fallbackParse(prompt: string): ParseResult {
  const num = (re: RegExp): number | undefined => {
    const m = prompt.match(re);
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
  const wantsSwap = /\b(swap|uniswap|trade|trading)\b/i.test(prompt);

  return {
    ok: true,
    mode: "fallback",
    intent: {
      purpose: prompt.trim().slice(0, 100),
      token: "USDC",
      dailyCapUsd,
      perCallCapUsd,
      allowedTargets: wantsSwap ? ["uniswap-v3"] : ["x402"],
      expiresInDays
    }
  };
}

function stripJsonFence(content: string) {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}
