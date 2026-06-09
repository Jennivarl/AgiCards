import type { Address } from "viem";
import { getAgentSigner } from "./signer";

// The DELEGATE for a card is the agent's server-side EOA session key. The user
// grants the card permission TO this address; the agent later redeems from the
// same EOA via sendTransactionWithDelegation (paying its own gas in ETH). Keep
// the agent key stable (AGENT_LOCAL_PRIVATE_KEY) so the funded address matches
// the delegate a card was granted to.
export async function getSessionAddress(cardId: string): Promise<Address> {
  const account = await getAgentSigner().getAccount(cardId);
  return account.address;
}
