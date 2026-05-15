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

## Checks

```bash
npm run test
npm run typecheck
npm run build
```

## Contract Compile And Deploy

```bash
npm run compile:contract
npm run deploy:0g
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the 0G Galileo deployment flow.

## 0G Integration

The planned deployed contract is `contracts/AgiCardsRegistry.sol`.

For local development, storage returns mock Merkle roots unless `OG_STORAGE_PRIVATE_KEY` or `DEPLOYER_PRIVATE_KEY` is set. When configured, the storage adapter uploads JSON payloads to 0G Storage with the official TypeScript SDK.

For local development, compute uses the deterministic policy engine unless `OG_COMPUTE_API_KEY` is set. When configured, the compute adapter calls the 0G Compute Router OpenAI-compatible `/chat/completions` endpoint.

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

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the 3-minute hackathon demo flow.
See [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md) for the system diagram.

## User Deposit Layer

AgiCards requires users to deposit funds before agents can request cards. The wallet tracks deposited, reserved, spent, and available balances. Every card request reserves funds first; rejected requests release funds, and completed spends reduce the user's available balance.

## Stripe Strategy

Stripe Issuing is used as a future real-card adapter. Because live issuing has country and program restrictions, the hackathon MVP supports Stripe test/mock mode plus a working 0G-native Web3 card flow.
