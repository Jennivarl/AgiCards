// ─────────────────────────────────────────────────────────────────────────────
// 0G Compute — the agent's BRAIN.
//
// This is what makes AgiCards AI-native ON 0G: the model that understands the
// user's request (and, next, reasons about each payment) runs on the 0G Compute
// Network, not on a normal server. Take 0G away and the agent cannot think.
//
// We use 0G's Router, an OpenAI-compatible endpoint, so a plain HTTP call to
// /chat/completions is all we need (no on-chain broker setup required).
//
// SETUP (fill these in .env.local — no code change needed):
//   1. Get an API key from the 0G Compute console and deposit 0G tokens:
//        Testnet:  https://pc.testnet.0g.ai
//        Mainnet:  https://pc.0g.ai
//      (connect wallet -> deposit 0G -> create API key)
//   2. Pick a model name from the router's Models catalog in that console.
//   3. Set:
//        OG_COMPUTE_API_KEY=<your router api key>
//        OG_COMPUTE_MODEL=<a model name from the catalog>
//        OG_COMPUTE_BASE_URL=<optional; defaults to the testnet router below>
// ─────────────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// 0G Compute Router base URLs (OpenAI-compatible).
//   Mainnet: https://router-api.0g.ai/v1   (what AgiCards v1 used)
//   Testnet: https://router-api-testnet.integratenetwork.work/v1
// Defaults match v1, so only OG_COMPUTE_API_KEY is strictly required.
const DEFAULT_BASE_URL = "https://router-api.0g.ai/v1";
const DEFAULT_MODEL = "OGM-1.0-35B-A3B";
const DEFAULT_FALLBACK_MODEL = "deepseek-v4-pro";

function config() {
  return {
    apiKey: process.env.OG_COMPUTE_API_KEY,
    model: process.env.OG_COMPUTE_MODEL || DEFAULT_MODEL,
    fallbackModel: process.env.OG_COMPUTE_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL,
    baseUrl: process.env.OG_COMPUTE_BASE_URL || DEFAULT_BASE_URL
  };
}

// Only the API key is required now (model has a known-good default), so callers
// can fall back gracefully (e.g. to the deterministic parser) when no key is set.
export function brainConfigured(): boolean {
  return Boolean(config().apiKey);
}

export function brainModel(): string {
  return config().model;
}

// Send a chat request to the 0G Compute Router and return the model's reply.
// Tries the primary model, then the fallback model (as v1 did) before failing.
export async function askBrain(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const { apiKey, model, fallbackModel } = config();
  if (!apiKey) throw new Error("OG_COMPUTE_API_KEY is not set.");

  try {
    return await callRouter(model, messages, opts);
  } catch (primaryError) {
    if (fallbackModel && fallbackModel !== model) {
      console.warn("0G Compute primary model failed; trying fallback.", primaryError);
      return await callRouter(fallbackModel, messages, opts);
    }
    throw primaryError;
  }
}

async function callRouter(
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const { apiKey, baseUrl } = config();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0,
      max_tokens: opts.maxTokens ?? 512
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`0G Compute router ${res.status} (${model}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("0G Compute router returned no content.");
  return content.trim();
}
