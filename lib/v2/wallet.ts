"use client";

import {
  createWalletClient,
  custom,
  type Account,
  type Address,
  type Chain,
  type Transport,
  type WalletClient
} from "viem";
import { V2_CHAIN } from "./chains";

// Browser MetaMask (EIP-1193) provider.
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type ConnectedWallet = {
  address: Address;
  walletClient: WalletClient<Transport, Chain | undefined, Account>;
};

function getProvider(): Eip1193Provider {
  const eth = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth) {
    throw new Error(
      "No MetaMask detected. Install MetaMask Flask 13.5+ to use AgiCards."
    );
  }
  return eth;
}

const BASE_HEX = "0x2105"; // 8453

// Make sure the wallet is pointed at Base mainnet (where the agent spends real USDC).
async function ensureBase(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_HEX }]
    });
  } catch {
    // Chain not added in the wallet yet — add it, then it becomes selectable.
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_HEX,
          chainName: V2_CHAIN.name,
          nativeCurrency: V2_CHAIN.nativeCurrency,
          rpcUrls: V2_CHAIN.rpcUrls.default.http,
          blockExplorerUrls: [V2_CHAIN.blockExplorers?.default.url]
        }
      ]
    });
  }
}

// Connect the user's MetaMask and return an account-bound wallet client ready to
// be wrapped as a MetaMask smart account.
export async function connectMetaMask(): Promise<ConnectedWallet> {
  const provider = getProvider();

  // Always show MetaMask's connect prompt (account selection) rather than silently
  // reconnecting a site that was permitted before. eth_requestAccounts alone is
  // silent once permission exists; wallet_requestPermissions forces the popup.
  try {
    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });
  } catch {
    throw new Error("Wallet connection was rejected.");
  }

  await ensureBase(provider);

  const probe = createWalletClient({
    chain: V2_CHAIN,
    transport: custom(provider)
  });
  const [address] = await probe.requestAddresses();

  const walletClient = createWalletClient({
    account: address,
    chain: V2_CHAIN,
    transport: custom(provider)
  });

  return { address, walletClient };
}
