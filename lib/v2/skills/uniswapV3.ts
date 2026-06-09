import { encodeFunctionData, parseUnits, zeroAddress } from "viem";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  WETH_ADDRESS,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_FEE
} from "../tokens";
import type { AgentSkill, SkillCall, SkillInput } from "./types";

// Uniswap V3 SwapRouter02 exactInputSingle (no deadline in the struct).
const SWAP_ROUTER_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ]
      }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  }
] as const;

// Swap skill: spend USDC to buy another token on Uniswap V3, within the card's
// daily cap. `target` is the token to buy (defaults to WETH); `account` is the
// recipient (the user's smart account). MVP sets amountOutMinimum = 0 — add
// slippage protection and USDC approval/Permit2 before a real run.
export const uniswapV3Skill: AgentSkill = {
  key: "uniswap-v3",
  label: "Token swap (Uniswap V3)",
  async buildCall(input: SkillInput): Promise<SkillCall> {
    const amountIn = parseUnits(String(input.amountUsd), USDC_DECIMALS);
    const tokenOut =
      input.target && input.target !== zeroAddress ? input.target : WETH_ADDRESS;
    const recipient = input.account ?? zeroAddress;

    const data = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: USDC_ADDRESS,
          tokenOut,
          fee: UNISWAP_V3_FEE,
          recipient,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n
        }
      ]
    });

    const out = `${tokenOut.slice(0, 6)}…${tokenOut.slice(-4)}`;
    return {
      to: UNISWAP_V3_ROUTER,
      data,
      value: 0n,
      amountUsd: input.amountUsd,
      summary: `Swapped $${input.amountUsd.toFixed(2)} USDC → ${out} on Uniswap V3${
        input.note ? ` (${input.note})` : ""
      }`
    };
  }
};
