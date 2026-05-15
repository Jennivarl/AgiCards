# AgiCards Demo Script

Target length: under 3 minutes.

## 1. Open Dashboard

Show AgiCards as a wallet and card-control layer for AI agents.

Say:

```txt
AgiCards lets users fund a wallet, generate AI agents, assign spending rules, and let those agents request controlled cards or Web3 spends with 0G proof.
```

## 2. Connect Wallet

Click `Connect wallet`.

Show that the connected wallet becomes the owner for deposits and agent activity.

## 3. Check Integrations

Click `Check integrations`.

Show:

- 0G Chain
- 0G Storage
- 0G Compute
- Stripe adapter

Explain which ones are live-ready or in fallback mode.

## 4. Generate Agent

Use the `Generate Agent` form.

Example:

```txt
Agent: Research Agent
Purpose: Find useful AI tools and request controlled cards for approved software purchases.
Categories: SaaS, AI tools, Marketing
Max/request: 20
Daily limit: 80
Auto approve: 8
```

Click `Generate agent`.

## 5. Register Agent Proof

Click `Register agent proof`.

Show:

- agent root
- policy root
- agent registration proof hash
- policy creation proof hash

## 6. Deposit Funds

Deposit demo funds.

Show:

- deposited balance
- available balance
- deposit storage root
- wallet funding proof hash

## 7. Create Card Order

Use the `Card Order` panel.

Example:

```txt
Mode: 0G Web3
Merchant: AI Landing Reviewer
Category: AI tools
Amount: 7
Purpose: Review landing page copy before launch
```

Click `Evaluate and issue`.

Show the order steps:

- risk check
- reserve funds
- issue card
- store proof

## 8. Show Activity And Proof

Show the latest request:

- risk score
- policy checks
- request root
- decision root
- receipt root
- card/spend proof hashes

## 9. Explain Stripe Future Path

Say:

```txt
The same policy and proof layer can route approved requests to Stripe Issuing in supported jurisdictions. The MVP keeps Stripe isolated behind an adapter while the 0G-native flow proves the agent-spending logic today.
```

## 10. Close

Say:

```txt
0G powers the agent identity, policies, memory, compute decisions, and verifiable audit trail behind every card request.
```

