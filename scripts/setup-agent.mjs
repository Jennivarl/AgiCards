// One-shot setup for REAL spending on Base.
//   node scripts/setup-agent.mjs
//
// - Generates a throwaway agent key (if you don't already have one) and saves it
//   to .env.local (which is gitignored).
// - Turns OFF "pretend" mode so the agent actually spends (EXECUTION_TRANSPORT=wallet).
// - Prints the agent's PUBLIC address — the one you fund with a little Base ETH.
//   The secret key is never printed.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const ENV = ".env.local";
let content = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";

function getVar(name) {
  const m = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}
function setVar(name, value) {
  if (new RegExp(`^${name}=.*$`, "m").test(content)) {
    content = content.replace(new RegExp(`^${name}=.*$`, "m"), `${name}=${value}`);
  } else {
    if (content && !content.endsWith("\n")) content += "\n";
    content += `${name}=${value}\n`;
  }
}

// 1) Agent key
let key = getVar("AGENT_LOCAL_PRIVATE_KEY");
if (!key) {
  key = generatePrivateKey();
  setVar("AGENT_LOCAL_PRIVATE_KEY", key);
  console.log("✓ Generated a new agent key and saved it to .env.local");
} else {
  console.log("✓ Found an existing AGENT_LOCAL_PRIVATE_KEY in .env.local");
}

// 2) Real spends (not simulated)
if (getVar("EXECUTION_TRANSPORT") !== "wallet") {
  setVar("EXECUTION_TRANSPORT", "wallet");
  console.log("✓ Set EXECUTION_TRANSPORT=wallet (real on-chain spends)");
} else {
  console.log("✓ EXECUTION_TRANSPORT already set to wallet");
}

writeFileSync(ENV, content);

// 3) Show the address to fund (never the secret)
const normalized = key.startsWith("0x") ? key : `0x${key}`;
const account = privateKeyToAccount(normalized);

console.log("\n────────────────────────────────────────────────────────────");
console.log("  FUND THIS ADDRESS with a little Base ETH (for gas fees):");
console.log("  " + account.address);
console.log("────────────────────────────────────────────────────────────");
console.log("\nNext steps:");
console.log("  1. Send ~$2 of Base ETH to the address above.");
console.log("  2. Make sure your MetaMask account has some USDC on Base.");
console.log("  3. Restart the dev server:  npm run dev");
console.log("  4. Open /studio, connect, mint a card (tiny caps), run the agent.\n");
