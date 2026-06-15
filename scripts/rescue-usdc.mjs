// Send USDC that landed in the agent (robot) wallet back to YOUR wallet.
//   node scripts/rescue-usdc.mjs 0xYourMetaMaskAddress
//
// The agent wallet's key is in .env.local, so we control it. It already has a
// little Base ETH, which pays the gas for this transfer. Sends the FULL USDC
// balance to the address you pass.

import { readFileSync, existsSync } from "node:fs";
import {
  createWalletClient,
  createPublicClient,
  http,
  erc20Abi,
  formatUnits,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
function envVar(name) {
  const m = env.match(new RegExp(`^${name}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

let key = envVar("AGENT_LOCAL_PRIVATE_KEY");
if (!key) {
  console.error("No AGENT_LOCAL_PRIVATE_KEY found in .env.local.");
  process.exit(1);
}
if (!key.startsWith("0x")) key = "0x" + key;

const to = process.argv[2];
if (!to || !isAddress(to)) {
  console.error("Usage: node scripts/rescue-usdc.mjs 0xYourMetaMaskAddress");
  process.exit(1);
}

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
const rpc = envVar("NEXT_PUBLIC_BASE_RPC_URL") || base.rpcUrls.default.http[0];
const account = privateKeyToAccount(key);
const pub = createPublicClient({ chain: base, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: base, transport: http(rpc) });

console.log(`Agent wallet: ${account.address}`);
const bal = await pub.readContract({
  address: USDC,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [account.address],
});
console.log(`USDC balance: ${formatUnits(bal, 6)} USDC`);

if (bal === 0n) {
  console.log("Nothing to send — the agent wallet has 0 USDC.");
  process.exit(0);
}

console.log(`\nSending ${formatUnits(bal, 6)} USDC  ->  ${to}`);
const hash = await wallet.writeContract({
  address: USDC,
  abi: erc20Abi,
  functionName: "transfer",
  args: [to, bal],
});
console.log("Tx: https://basescan.org/tx/" + hash);
const receipt = await pub.waitForTransactionReceipt({ hash });
console.log("Status:", receipt.status);
console.log(receipt.status === "success" ? "✓ USDC sent back to your wallet." : "✗ Transfer reverted.");
