import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "./compile-contract.mjs";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const rpcUrl = process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc-testnet.0g.ai";
const explorerUrl = process.env.NEXT_PUBLIC_0G_EXPLORER_URL || "https://chainscan-galileo.0g.ai";

if (!privateKey) {
  throw new Error("Missing DEPLOYER_PRIVATE_KEY in environment.");
}

const artifactPath = path.join(process.cwd(), "artifacts", "AgiCardsRegistry.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const galileo = defineChain({
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G"
  },
  rpcUrls: {
    default: {
      http: [rpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: explorerUrl
    }
  }
});
const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({
  account,
  chain: galileo,
  transport: http(rpcUrl)
});
const publicClient = createPublicClient({
  chain: galileo,
  transport: http(rpcUrl)
});

console.log(`Deploying AgiCardsRegistry from ${account.address}...`);

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode
});

console.log(`Deployment transaction: ${hash}`);
console.log(`${explorerUrl}/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });

if (!receipt.contractAddress) {
  throw new Error("Deployment transaction did not return a contract address.");
}

console.log(`AgiCardsRegistry deployed: ${receipt.contractAddress}`);
console.log(`${explorerUrl}/address/${receipt.contractAddress}`);
console.log("");
console.log("Add this to .env.local:");
console.log(`AGICARDS_REGISTRY_ADDRESS=${receipt.contractAddress}`);
