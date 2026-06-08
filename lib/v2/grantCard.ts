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

// Mint the AgiCard: ask MetaMask (ERC-7715) to grant the agent's session account
// a daily USDC spend permission. The on-chain caveat enforcer — not our code —
// guarantees the agent can never exceed this. Returns what we store and later
// redeem.
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
