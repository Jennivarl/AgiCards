# AgiCards Demo Script

Target length: under 3 minutes.

> Note: The dashboard is pre-loaded with demo data to illustrate a real session.
> Wallet: $2,450.00 · Agent: Research Agent · Latest request: $7.00 to Cursor AI · Status: Approved

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

Point to the pre-filled demo agent on the dashboard first — Name: Research Agent, Purpose: AI tools & SaaS procurement, Daily Cap: $80.00, Status: Active (green).

Then show the form with these values (matches the demo data already loaded):

```txt
Agent: Research Agent
Purpose: AI tools & SaaS procurement
Categories: SaaS, AI Tools
Max/request: $20
Daily limit: $80
Auto approve: Under $8
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

Point to the Latest Card Request panel on the dashboard — Merchant: Cursor AI, Amount: $7.00, Risk Score: Low · 12/100, Status: Approved (green).

Say: "This $7.00 request to Cursor AI was under the $8 auto-approval threshold — 0G Compute evaluated the policy and approved it automatically."

Then show the card order form with these values:

```txt
Mode: 0G Web3
Merchant: Cursor AI
Category: AI Tools
Amount: $7
Purpose: AI-assisted code review for launch sprint
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

