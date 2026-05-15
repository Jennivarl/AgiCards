import { makeId } from "../id";
import type { CardRequest, StripeCardMetadata } from "../types";

export class StripeIssuingAdapter {
  async createVirtualCard(request: CardRequest): Promise<StripeCardMetadata> {
    return {
      provider: "stripe",
      cardId: makeId("stripe_card", request.id),
      cardholderId: "ich_mock_agicards_user",
      brand: "visa",
      last4: `${Math.floor(1000 + Math.random() * 8999)}`,
      status: "active",
      spendingLimitUsd: request.amountUsd
    };
  }
}

export const stripeIssuing = new StripeIssuingAdapter();

