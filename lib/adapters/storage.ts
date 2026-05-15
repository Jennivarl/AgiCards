import { makeRoot } from "../id";
import type { StorageObject } from "../types";

export class OgStorageAdapter {
  async store(type: StorageObject["type"], payload: unknown): Promise<StorageObject> {
    const object: StorageObject = {
      root: makeRoot({ type, payload, createdAt: new Date().toISOString() }),
      type,
      createdAt: new Date().toISOString(),
      payload
    };

    return object;
  }
}

export const ogStorage = new OgStorageAdapter();

