import {
  zeroAddress,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type Transport,
  type WalletClient
} from "viem";

// A wallet client that is guaranteed to carry an account (browser MetaMask once
// connected, or a server walletClient built from a key) — required by the
// smart-account signer and the EIP-7702 authorization signing.
type ConnectedWalletClient = WalletClient<Transport, Chain | undefined, Account>;
import {
  Implementation,
  toMetaMaskSmartAccount,
  getSmartAccountsEnvironment
} from "@metamask/smart-accounts-kit";
import { V2_CHAIN, publicClient } from "./chains";

// The on-chain implementation an EOA delegates its code to when it "upgrades"
// to a MetaMask smart account under EIP-7702 on this chain.
export function eip7702DelegatorAddress(): Hex {
  const env = getSmartAccountsEnvironment(V2_CHAIN.id);
  return env.implementations.EIP7702StatelessDeleGatorImpl;
}

// Wrap an already-connected EOA (browser MetaMask, or a server walletClient) as
// a MetaMask Stateless-7702 smart account. Counterfactual until first use.
// Browser users get the real 7702 upgrade prompt from MetaMask during the
// ERC-7715 grant step (Phase 3); this just gives us the smart-account handle.
export async function toUserSmartAccount(
  walletClient: ConnectedWalletClient,
  address: Address
) {
  return toMetaMaskSmartAccount({
    client: publicClient(),
    implementation: Implementation.Stateless7702,
    address,
    signer: { walletClient }
  });
}

// Explicit EIP-7702 upgrade for a LOCAL / server signer (demo scripts, the
// background agent). The signed authorization cannot be sent on its own, so it
// rides on a dummy self-transaction. Returns the upgrade tx hash. In production
// this call is routed through the 1Shot relayer so gas is sponsored.
export async function upgradeEoaTo7702(
  walletClient: ConnectedWalletClient
): Promise<Hex> {
  const account = walletClient.account;

  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress: eip7702DelegatorAddress(),
    executor: "self"
  });

  return walletClient.sendTransaction({
    account,
    chain: V2_CHAIN,
    authorizationList: [authorization],
    data: "0x",
    to: zeroAddress
  });
}

// Make sure the connected account is an EIP-7702 smart account on this chain. If
// it has no code yet, run the one-time upgrade (a 7702 transaction the user signs
// in MetaMask) and wait for it to land. Required before any delegation the account
// signs can be redeemed by the agent.
export async function ensureUserUpgraded(
  walletClient: ConnectedWalletClient
): Promise<void> {
  const address = walletClient.account.address;
  const code = await publicClient().getCode({ address });
  if (code && code !== "0x") return; // already a smart account
  const hash = await upgradeEoaTo7702(walletClient);
  await publicClient().waitForTransactionReceipt({ hash });
}
