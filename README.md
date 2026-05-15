# AgiCards

AgiCards lets AI agents request controlled virtual cards, with spending policies, approvals, memory, and audit trails powered by 0G.

## What This MVP Proves

- Users deposit funds into an AgiCards wallet before delegating spend authority.
- Agents request Stripe-style real cards or 0G-native Web3 card spends.
- 0G Chain records agent, policy, approval, deposit, and spend proof.
- 0G Storage persists policies, receipts, memory, and audit logs.
- 0G Compute evaluates request risk and produces approval explanations.
- Stripe Issuing is isolated behind an adapter for future production use.

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## 0G Integration

The planned deployed contract is `contracts/AgiCardsRegistry.sol`.

The demo will submit:

- 0G contract address
- 0G Explorer link
- 0G Storage roots for policies, memory, and receipts
- Demo video showing the full user deposit -> agent request -> approval -> spend proof flow

## Repository Structure

```txt
app/                    Next.js dashboard and API routes
contracts/              0G Chain proof registry
docs/                   architecture and submission notes
lib/adapters/           0G, Stripe, and Web3 card adapters
lib/policyEngine.ts     funding, limit, and approval checks
```

## User Deposit Layer

AgiCards requires users to deposit funds before agents can request cards. The wallet tracks deposited, reserved, spent, and available balances. Every card request reserves funds first; rejected requests release funds, and completed spends reduce the user's available balance.

## Stripe Strategy

Stripe Issuing is used as a future real-card adapter. Because live issuing has country and program restrictions, the hackathon MVP supports Stripe test/mock mode plus a working 0G-native Web3 card flow.
