import { makeRoot } from "../id";
import type { StorageObject } from "../types";

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

  async store(type: StorageObject["type"], payload: unknown): Promise<StorageObject> {
    if (this.privateKey) {
      try {
        return await this.storeOn0g(type, payload);
      } catch (error) {
        console.warn("0G Storage upload failed; falling back to mock root.", error);
      }
    }

    const object: StorageObject = {
      root: makeRoot({ type, payload, createdAt: new Date().toISOString() }),
      type,
      createdAt: new Date().toISOString(),
      payload,
      mode: "mock"
    };

    return object;
  }

  private async storeOn0g(type: StorageObject["type"], payload: unknown): Promise<StorageObject> {
    const [{ Indexer, MemData }, { ethers }] = await Promise.all([
      import("@0gfoundation/0g-storage-ts-sdk"),
      import("ethers")
    ]);
    const createdAt = new Date().toISOString();
    const encoded = new TextEncoder().encode(
      JSON.stringify({
        type,
        createdAt,
        payload
      })
    );
    const memData = new MemData(encoded);
    const [tree, treeErr] = await memData.merkleTree();

    if (treeErr !== null) {
      throw new Error(`0G Storage merkle tree error: ${treeErr}`);
    }

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const signer = new ethers.Wallet(this.privateKey!, provider);
    const indexer = new Indexer(this.indexerRpc);
    const [tx, uploadErr] = await indexer.upload(memData, this.rpcUrl, signer, { finalityRequired: false });

    if (uploadErr !== null) {
      throw new Error(`0G Storage upload error: ${uploadErr}`);
    }

    const root = "rootHash" in tx ? tx.rootHash : tree?.rootHash();

    if (!root) {
      throw new Error("0G Storage upload did not return a root hash.");
    }

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
