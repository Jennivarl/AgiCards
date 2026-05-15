import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  type Address,
  type Hash,
  type Hex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AGICARDS_REGISTRY_ABI } from "../contracts/agicardsRegistry";
import { makeRoot } from "../id";
import { ogMainnet } from "../ogNetwork";

const mainnetChain = defineChain({
  id: ogMainnet.id,
  name: ogMainnet.name,
  nativeCurrency: ogMainnet.nativeCurrency,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_0G_RPC_URL || ogMainnet.rpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: ogMainnet.explorerUrl
    }
  }
});

type ChainWriteResult = {
  mode: "live" | "mock";
  hash: Hash;
};

type RegisterAgentInput = {
  agentId: Hex;
  metadataRoot: Hex;
};

type PolicyInput = {
  policyId: Hex;
  agentId: Hex;
  policyRoot: Hex;
  maxPerRequestOg: string;
  dailyLimitOg: string;
};

type RequestCardInput = {
  requestId: Hex;
  agentId: Hex;
  policyId: Hex;
  amountOg: string;
  requestRoot: Hex;
  stripeMode: boolean;
};

export class OgChainAdapter {
  private readonly registryAddress = process.env.AGICARDS_REGISTRY_ADDRESS as Address | undefined;
  private readonly privateKey = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;

  publicClient = createPublicClient({
    chain: mainnetChain,
    transport: http(process.env.NEXT_PUBLIC_0G_RPC_URL || ogMainnet.rpcUrl)
  });

  isConfigured() {
    return Boolean(this.registryAddress && this.privateKey);
  }

  status() {
    return {
      configured: this.isConfigured(),
      chainId: ogMainnet.id,
      rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL || ogMainnet.rpcUrl,
      registryAddress: this.registryAddress ?? null
    };
  }

  async registerAgent(input: RegisterAgentInput): Promise<ChainWriteResult> {
    return this.write("registerAgent", [input.agentId, input.metadataRoot]);
  }

  async depositFunds(receiptRoot: Hex, amountOg: string): Promise<ChainWriteResult> {
    return this.write("depositFunds", [receiptRoot], parseEther(amountOg));
  }

  async createPolicy(input: PolicyInput): Promise<ChainWriteResult> {
    return this.write("createPolicy", [
      input.policyId,
      input.agentId,
      input.policyRoot,
      parseEther(input.maxPerRequestOg),
      parseEther(input.dailyLimitOg)
    ]);
  }

  async requestCard(input: RequestCardInput): Promise<ChainWriteResult> {
    return this.write("requestCard", [
      input.requestId,
      input.agentId,
      input.policyId,
      parseEther(input.amountOg),
      input.requestRoot,
      input.stripeMode
    ]);
  }

  async approveCardRequest(requestId: Hex, decisionRoot: Hex): Promise<ChainWriteResult> {
    return this.write("approveCardRequest", [requestId, decisionRoot]);
  }

  async rejectCardRequest(requestId: Hex, decisionRoot: Hex): Promise<ChainWriteResult> {
    return this.write("rejectCardRequest", [requestId, decisionRoot]);
  }

  async linkStripeCard(requestId: Hex, stripeCardHash: Hex, cardMetadataRoot: Hex): Promise<ChainWriteResult> {
    return this.write("linkStripeCard", [requestId, stripeCardHash, cardMetadataRoot]);
  }

  async createWeb3Card(requestId: Hex, web3CardId: Hex, cardMetadataRoot: Hex): Promise<ChainWriteResult> {
    return this.write("createWeb3Card", [requestId, web3CardId, cardMetadataRoot]);
  }

  async logWeb3Spend(requestId: Hex, amountOg: string, receiptRoot: Hex): Promise<ChainWriteResult> {
    return this.write("logWeb3Spend", [requestId, parseEther(amountOg), receiptRoot]);
  }

  async logStripeAuthorization(requestId: Hex, amountOg: string, receiptRoot: Hex): Promise<ChainWriteResult> {
    return this.write("logStripeAuthorization", [requestId, parseEther(amountOg), receiptRoot]);
  }

  async updateAgentMemory(agentId: Hex, memoryRoot: Hex): Promise<ChainWriteResult> {
    return this.write("updateAgentMemory", [agentId, memoryRoot]);
  }

  private async write(functionName: string, args: readonly unknown[], value?: bigint): Promise<ChainWriteResult> {
    if (!this.registryAddress || !this.privateKey) {
      return {
        mode: "mock",
        hash: makeRoot({ functionName, args, value: value?.toString() ?? "0" }) as Hash
      };
    }

    const account = privateKeyToAccount(this.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: mainnetChain,
      transport: http(process.env.NEXT_PUBLIC_0G_RPC_URL || ogMainnet.rpcUrl)
    });

    const hash = await walletClient.writeContract({
      address: this.registryAddress,
      abi: AGICARDS_REGISTRY_ABI,
      functionName: functionName as never,
      args: args as never,
      value
    });

    return {
      mode: "live",
      hash
    };
  }
}

export const ogChain = new OgChainAdapter();
