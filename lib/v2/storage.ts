import { keccak256, stringToHex } from "viem";

// A record stored to 0G Storage. Live (real Merkle root) when 0G keys are set,
// otherwise a deterministic mock root so the audit trail works without config.
export type StorageObject = {
  root: string;
  type: string;
  createdAt: string;
  payload: unknown;
  mode?: "live" | "mock";
  txHash?: string;
};

function makeRoot(input: unknown) {
  return keccak256(stringToHex(JSON.stringify(input)));
}

// 0G Storage adapter: uploads a tamper-proof execution record and returns its
// Merkle root, falling back to a mock root when 0G keys aren't configured.
export class OgStorageAdapter {
  private readonly rpcUrl = process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc.0g.ai";
  private readonly indexerRpc = process.env.OG_STORAGE_INDEXER_RPC || "https://indexer-storage-turbo.0g.ai";
  private readonly privateKey = process.env.OG_STORAGE_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

  status() {
    return {
      configured: Boolean(this.privateKey),
      rpcUrl: this.rpcUrl,
      indexerRpc: this.indexerRpc
    };
  }

  async store(type: string, payload: unknown): Promise<StorageObject> {
    if (this.privateKey) {
      try {
        return await this.storeOn0g(type, payload);
      } catch (error) {
        console.warn("0G Storage upload failed; falling back to mock root.", error);
      }
    }

    const createdAt = new Date().toISOString();
    return { root: makeRoot({ type, payload, createdAt }), type, createdAt, payload, mode: "mock" };
  }

  private async storeOn0g(type: string, payload: unknown): Promise<StorageObject> {
    const [{ Indexer, MemData }, { ethers }] = await Promise.all([
      import("@0gfoundation/0g-storage-ts-sdk"),
      import("ethers")
    ]);
    const createdAt = new Date().toISOString();
    const encoded = new TextEncoder().encode(JSON.stringify({ type, createdAt, payload }));
    const memData = new MemData(encoded);
    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null) throw new Error(`0G Storage merkle tree error: ${treeErr}`);

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const signer = new ethers.Wallet(this.privateKey!, provider);
    const indexer = new Indexer(this.indexerRpc);
    const [tx, uploadErr] = await indexer.upload(memData, this.rpcUrl, signer, { finalityRequired: false });
    if (uploadErr !== null) throw new Error(`0G Storage upload error: ${uploadErr}`);

    const root = "rootHash" in tx ? tx.rootHash : tree?.rootHash();
    if (!root) throw new Error("0G Storage upload did not return a root hash.");

    return {
      root,
      txHash: "txHash" in tx ? tx.txHash : tx.txHashes?.[0],
      type,
      createdAt,
      payload,
      mode: "live"
    };
  }
}

export const ogStorage = new OgStorageAdapter();
