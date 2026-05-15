import { keccak256, stringToHex, type Hex } from "viem";
import { OgChainAdapter } from "../lib/adapters/chain";
import { OgStorageAdapter } from "../lib/adapters/storage";
import { OgComputeAdapter } from "../lib/adapters/compute";

function makeId(label: string): Hex {
  return keccak256(stringToHex(`${label}:${Date.now()}:${Math.random()}`));
}

async function main() {
  const chain = new OgChainAdapter();
  const storage = new OgStorageAdapter();
  const compute = new OgComputeAdapter();

  const explorerUrl = process.env.NEXT_PUBLIC_0G_EXPLORER_URL || "https://chainscan.0g.ai";
  const txLink = (hash: string) => `${explorerUrl}/tx/${hash}`;

  const waitForTx = async (hash: string, mode: string) => {
    if (mode === "live") {
      await chain.publicClient.waitForTransactionReceipt({ hash: hash as Hex });
    }
  };

  console.log("\n=== AgiCards Demo Proof ===\n");
  console.log(`Chain configured:   ${chain.isConfigured()}`);
  console.log(`Compute configured: ${compute.status().configured}`);
  console.log(`Storage configured: ${storage.status().configured}`);
  console.log("");

  const agentId = makeId("agent");
  const policyId = makeId("policy");
  const requestId = makeId("request");
  const web3CardId = makeId("web3card");

  // 1. Upload agent profile to 0G Storage
  console.log("1. Uploading agent profile to 0G Storage...");
  const agentProfile = await storage.store("agent", {
    name: "AgiCards Demo Agent",
    agentId,
    capabilities: ["card_request", "web3_spend"],
    createdAt: new Date().toISOString()
  });
  console.log(`   Root: ${agentProfile.root}`);
  console.log(`   Mode: ${agentProfile.mode}`);

  // 2. Register agent on-chain
  console.log("\n2. Registering agent on 0G Chain...");
  const registerTx = await chain.registerAgent({ agentId, metadataRoot: agentProfile.root as Hex });
  console.log(`   Tx:   ${txLink(registerTx.hash)}`);
  console.log(`   Mode: ${registerTx.mode}`);
  await waitForTx(registerTx.hash, registerTx.mode);

  // 3. Deposit funds on-chain
  console.log("\n3. Depositing funds on 0G Chain...");
  const depositReceiptObj = await storage.store("deposit", {
    action: "deposit",
    amount: "0.001",
    createdAt: new Date().toISOString()
  });
  const depositTx = await chain.depositFunds(depositReceiptObj.root as Hex, "0.001");
  console.log(`   Tx:   ${txLink(depositTx.hash)}`);
  console.log(`   Mode: ${depositTx.mode}`);

  // 4. Upload policy to 0G Storage
  console.log("\n4. Uploading policy to 0G Storage...");
  const policyObj = await storage.store("policy", {
    agentId,
    maxPerRequestOg: "0.0005",
    dailyLimitOg: "0.001",
    allowedCategories: ["software", "cloud", "tools"],
    createdAt: new Date().toISOString()
  });
  console.log(`   Root: ${policyObj.root}`);
  console.log(`   Mode: ${policyObj.mode}`);

  // 5. Create policy on-chain
  console.log("\n5. Creating policy on 0G Chain...");
  const policyTx = await chain.createPolicy({
    policyId,
    agentId,
    policyRoot: policyObj.root as Hex,
    maxPerRequestOg: "0.0005",
    dailyLimitOg: "0.001"
  });
  console.log(`   Tx:   ${txLink(policyTx.hash)}`);
  console.log(`   Mode: ${policyTx.mode}`);
  await waitForTx(policyTx.hash, policyTx.mode);

  // 6. Create card request on-chain
  console.log("\n6. Creating card request on 0G Chain...");
  const cardRequest = {
    amountUsd: 0.0005,
    category: "software",
    merchant: "0G Compute Provider",
    purpose: "AI inference for agent task",
    mode: "web3" as const
  };
  const requestRoot = keccak256(stringToHex(JSON.stringify({ ...cardRequest, requestId })));
  const requestTx = await chain.requestCard({
    requestId,
    agentId,
    policyId,
    amountOg: "0.0005",
    requestRoot,
    stripeMode: false
  });
  console.log(`   Tx:   ${txLink(requestTx.hash)}`);
  console.log(`   Mode: ${requestTx.mode}`);
  await waitForTx(requestTx.hash, requestTx.mode);

  // 7. 0G Compute risk evaluation
  console.log("\n7. Running 0G Compute risk evaluation...");
  const policy = {
    id: policyId,
    agentId,
    name: "Demo Agent Policy",
    maxPerRequestUsd: 100,
    dailyLimitUsd: 500,
    autoApproveBelowUsd: 50,
    allowedCategories: ["software", "cloud", "tools"],
    expiresInHours: 24,
    storageRoot: policyObj.root
  };
  const wallet = {
    depositedUsd: 500,
    reservedUsd: 0,
    spentUsd: 0,
    depositReceiptRoot: depositReceiptObj.root
  };
  const riskReport = await compute.evaluate(cardRequest, policy, wallet);
  const decisionRoot = keccak256(stringToHex(JSON.stringify(riskReport)));
  console.log(`   Decision:      ${riskReport.decision}`);
  console.log(`   Risk Score:    ${riskReport.riskScore}`);
  console.log(`   Reason:        ${riskReport.reason}`);
  console.log(`   Decision Root: ${decisionRoot}`);

  // 8. Approve card request on-chain
  console.log("\n8. Approving card request on 0G Chain...");
  const approveTx = await chain.approveCardRequest(requestId, decisionRoot);
  console.log(`   Tx:   ${txLink(approveTx.hash)}`);
  console.log(`   Mode: ${approveTx.mode}`);
  await waitForTx(approveTx.hash, approveTx.mode);

  // 9. Create Web3 card on-chain
  console.log("\n9. Creating Web3 card on 0G Chain...");
  const cardMetadataRoot = keccak256(
    stringToHex(JSON.stringify({ web3CardId, requestId, issuedAt: new Date().toISOString() }))
  );
  const web3CardTx = await chain.createWeb3Card(requestId, web3CardId, cardMetadataRoot);
  console.log(`   Tx:   ${txLink(web3CardTx.hash)}`);
  console.log(`   Mode: ${web3CardTx.mode}`);

  // 10. Log Web3 spend + upload receipt to 0G Storage
  console.log("\n10. Logging Web3 spend and uploading receipt to 0G Storage...");
  const receiptObj = await storage.store("receipt", {
    requestId,
    agentId,
    amount: "0.0005",
    merchant: cardRequest.merchant,
    decision: riskReport.decision,
    riskScore: riskReport.riskScore,
    completedAt: new Date().toISOString()
  });
  console.log(`    Root: ${receiptObj.root}`);
  console.log(`    Mode: ${receiptObj.mode}`);
  const spendTx = await chain.logWeb3Spend(requestId, "0.0005", receiptObj.root as Hex);
  console.log(`    Tx:   ${txLink(spendTx.hash)}`);
  console.log(`    Mode: ${spendTx.mode}`);

  // 11. Update agent memory on-chain
  console.log("\n11. Updating agent memory on 0G Chain...");
  const memoryObj = await storage.store("memory", {
    agentId,
    lastRequest: { requestId, decision: riskReport.decision, amount: "0.0005" },
    totalSpend: "0.0005",
    updatedAt: new Date().toISOString()
  });
  console.log(`    Root: ${memoryObj.root}`);
  console.log(`    Mode: ${memoryObj.mode}`);
  const memoryTx = await chain.updateAgentMemory(agentId, memoryObj.root as Hex);
  console.log(`    Tx:   ${txLink(memoryTx.hash)}`);
  console.log(`    Mode: ${memoryTx.mode}`);

  console.log("\n=== Proof Summary ===\n");
  console.log(`Agent Profile Root:    ${agentProfile.root}`);
  console.log(`Policy Root:           ${policyObj.root}`);
  console.log(`Compute Decision Root: ${decisionRoot}`);
  console.log(`Receipt Root:          ${receiptObj.root}`);
  console.log(`Memory Root:           ${memoryObj.root}`);
  console.log("");
  console.log(`Contract: ${process.env.AGICARDS_REGISTRY_ADDRESS}`);
  console.log(`Explorer: ${explorerUrl}/address/${process.env.AGICARDS_REGISTRY_ADDRESS}`);
  console.log("");

  return {
    agentProfileRoot: agentProfile.root,
    policyRoot: policyObj.root,
    decisionRoot,
    receiptRoot: receiptObj.root,
    memoryRoot: memoryObj.root
  };
}

main().catch((err) => {
  console.error("\nDemo proof failed:", err);
  process.exit(1);
});
