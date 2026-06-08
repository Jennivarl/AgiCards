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

const SEPOLIA_HEX = "0xaa36a7"; // 11155111

// Make sure the wallet is pointed at Sepolia (where ERC-7715 permissions work).
async function ensureSepolia(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX }]
    });
  } catch {
    // Chain not added in the wallet yet — add it, then it becomes selectable.
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA_HEX,
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
  await ensureSepolia(provider);

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
