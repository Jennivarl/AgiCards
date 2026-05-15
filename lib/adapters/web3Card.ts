import { makeId } from "../id";
import type { CardRequest, Web3CardMetadata } from "../types";

export class Web3CardAdapter {
  async createCard(request: CardRequest): Promise<Web3CardMetadata> {
    return {
      provider: "0g-web3",
      cardId: makeId("web3_card", request.id),
      status: "active",
      spendingLimitUsd: request.amountUsd
    };
  }
}

export const web3Card = new Web3CardAdapter();

