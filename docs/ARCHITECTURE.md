# AgiCards Architecture

See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) for a visual flow.

## Core Flow

```txt
User deposits funds
  -> User creates AI agent and spending policy
  -> Policy is stored on 0G Storage
  -> Policy hash/root is registered on 0G Chain
  -> Agent requests a Stripe card or 0G-native Web3 card
  -> 0G Compute evaluates risk and policy fit
  -> AgiCards reserves user funds
  -> Approval/rejection is logged on 0G Chain
  -> Selected card adapter runs
  -> Receipt is stored on 0G Storage
  -> Receipt hash/root is logged on 0G Chain
```

## Why Hybrid

Stripe Issuing is the future-facing real-card adapter, but live issuing has jurisdiction and program restrictions. AgiCards keeps Stripe isolated behind an adapter so the platform can support Stripe, Mastercard Agent Pay, or another issuer later.

The 0G-native Web3 card flow is the hackathon-safe path. It gives judges a working flow with verifiable 0G Chain events, 0G Storage receipt roots, and 0G Compute-style request evaluation.

## Components

### Frontend

- Next.js dashboard
- Deposit panel
- Agent and policy panel
- Request form with Stripe/Web3 mode switch
- Proof panels for 0G Chain, Storage, Compute, and Stripe adapter

### Backend

- `app/api/evaluate`: evaluates agent requests through the 0G Compute adapter
- `app/api/cards/issue`: issues a Stripe test card or 0G Web3 card through adapters
- `app/api/storage/mock`: local mock for 0G Storage shape during early development

### Smart Contract

- `contracts/AgiCardsRegistry.sol`
- Records deposits, policies, requests, approvals, card links, spends, receipts, and memory updates

### 0G Storage

Stores:

- agent profiles
- deposit receipts
- policy JSON
- decision reports
- redacted card metadata
- transaction receipts
- agent memory snapshots

### 0G Compute

Evaluates:

- policy fit
- funding availability
- category permission
- per-request limit
- daily limit
- whether human approval is required

The server adapter uses the 0G Compute Router when `OG_COMPUTE_API_KEY` is configured. If no key is available, it falls back to the deterministic local policy engine so demos remain usable while credentials are being set up.

### Agent ID

The MVP uses a contract-level `agentId`. If official 0G Agent ID tooling is available during the build, this ID can be linked to or replaced by the official Agent ID standard.

### Persistent Memory

The MVP stores memory snapshots on 0G Storage. When 0G Persistent Memory is available, the same memory objects can migrate into the native module.
