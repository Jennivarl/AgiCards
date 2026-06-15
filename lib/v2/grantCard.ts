"use client";

import { parseUnits, type Address, type Hex } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import type { ConnectedWallet } from "./wallet";
import type { ValidatedIntent } from "./intent";
import { V2_CHAIN } from "./chains";
import { USDC_ADDRESS, USDC_DECIMALS } from "./tokens";

export type GrantedCard = {
  permissionsContext: Hex;
  delegationManager: Address;
  expiry: number;
};

// Mint the AgiCard via MetaMask Advanced Permissions (ERC-7715). One MetaMask
// step grants the agent's session key a daily USDC spend permission AND upgrades
// the user's account to an EIP-7702 smart account, so the agent can later REDEEM
// the permission on-chain. The on-chain caveat enforcer guarantees the agent can
// never exceed the daily cap or act after expiry.
//
// REQUIRES MetaMask Flask (the Advanced Permissions / wallet_requestExecutionPermissions
// method is not in regular MetaMask). The raw ERC-7710 path was tried but a browser
// wallet cannot sign the EIP-7702 upgrade (viem signAuthorization needs a raw key),
// so 7715 is the only flow that works for a MetaMask user.
export async function grantCard(params: {
  walletClient: ConnectedWallet["walletClient"];
  intent: ValidatedIntent;
  sessionAddress: Address;
}): Promise<GrantedCard> {
  const { walletClient, intent, sessionAddress } = params;
  const expiry = Math.floor(Date.now() / 1000) + intent.expiresInDays * 86_400;

  const client = walletClient.extend(erc7715ProviderActions());

  const granted = await client.requestExecutionPermissions([
    {
      chainId: V2_CHAIN.id,
      expiry,
      to: sessionAddress,
      permission: {
        type: "erc20-token-periodic",
        isAdjustmentAllowed: true,
        data: {
          tokenAddress: USDC_ADDRESS,
          periodAmount: parseUnits(String(intent.dailyCapUsd), USDC_DECIMALS),
          periodDuration: 86_400,
          justification: `AgiCard: ${intent.purpose}`
        }
      }
    }
  ]);

  const grant = granted[0];
  if (!grant) throw new Error("MetaMask did not return a granted permission.");

  return {
    permissionsContext: grant.context,
    delegationManager: grant.delegationManager,
    expiry
  };
}
