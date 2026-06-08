import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import type { Address } from "viem";
import { publicClient } from "./chains";
import { getAgentSigner } from "./signer";

// The DELEGATE for a card: a MetaMask smart account controlled by the agent's
// server-side session key. The user grants the card's permission TO this
// account's address; the agent later redeems it to spend. Counterfactual until
// first use.
export async function getSessionSmartAccount(cardId: string) {
  const account = await getAgentSigner().getAccount(cardId);
  return toMetaMaskSmartAccount({
    client: publicClient(),
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: "0x",
    signer: { account }
  });
}

export async function getSessionAddress(cardId: string): Promise<Address> {
  const sessionAccount = await getSessionSmartAccount(cardId);
  return sessionAccount.address;
}
