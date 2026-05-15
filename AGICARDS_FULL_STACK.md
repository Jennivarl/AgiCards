# AgiCards Full Stack Plan

## Project Summary

AgiCards is a hybrid agent-spending platform for Track 3: Agentic Economy & Autonomous Applications.

It lets users create AI agents, assign spending policies, and allow those agents to request controlled cards or Web3 spending actions. 0G is the policy, memory, identity, compute, and audit layer. Stripe Issuing is used as the future real-card adapter, while a 0G-native Web3 card flow keeps the hackathon MVP fully functional and deeply integrated with 0G.

One-sentence description:

AgiCards lets AI agents request controlled virtual cards, with spending policies, approvals, memory, and audit trails powered by 0G.

## Core Product Idea

Users create AI agents and give them limited spending authority.

Example:

- A user creates a Marketing Agent.
- The user sets a policy: max $25 per card, SaaS category only, human approval above $50, expires in 24 hours.
- The agent requests a card or Web3 spend for a specific task.
- 0G Compute evaluates the request.
- The policy engine approves, rejects, or asks the user for approval.
- 0G Chain records the approval proof.
- 0G Storage stores the full policy, memory, reasoning, and receipt.
- Stripe test mode or mock mode can create a future real-card adapter.
- The 0G-native Web3 flow can process a real demo payment inside the app.

## High-Level Architecture

```txt
Frontend
  |
Backend / API
  |
  |-- Policy Engine
  |-- Agent Decision Engine
  |-- Stripe Issuing Adapter
  |-- 0G Storage Adapter
  |-- 0G Chain Adapter
  |-- 0G Compute Adapter
  |-- Webhook Handler
  |
0G Chain + 0G Storage + 0G Compute
  |
Stripe Issuing Test Adapter / Mock Adapter
  |
0G-native Web3 Merchant Flow
```

## Frontend Stack

- Next.js
- TypeScript
- Tailwind CSS
- wagmi / viem for wallet connection
- Stripe Issuing Elements for future PCI-safe card display
- Dashboard screens:
  - Agent creation
  - Policy creation
  - Card request review
  - Stripe card adapter status
  - Web3 card spend flow
  - Receipts and audit trail
  - 0G Explorer and Storage proof links

## Backend Stack

- Next.js API routes or Express server
- Policy engine
- Agent request processor
- Stripe Issuing adapter
- 0G Storage adapter
- 0G Chain adapter
- 0G Compute adapter
- Stripe webhook handler
- Web3 merchant/payment simulator

Backend responsibilities:

- Receive agent requests.
- Track user wallet balances and deposits.
- Fetch agent policy and memory from 0G Storage.
- Ask 0G Compute to evaluate risk and intent.
- Enforce spending policy.
- Submit approval/rejection events to 0G Chain.
- Create Stripe test cards when enabled.
- Create 0G-native Web3 spending receipts.
- Store redacted receipts and agent memory on 0G Storage.

## 0G Chain Integration

0G Chain is the verifiable proof layer.

Smart contract:

```txt
AgiCardsRegistry.sol
```

Core functions:

```txt
registerAgent()
depositFunds()
withdrawFunds()
createPolicy()
requestCard()
approveCardRequest()
rejectCardRequest()
reserveFundsForRequest()
releaseReservedFunds()
linkStripeCard()
createWeb3Card()
logWeb3Spend()
logStripeAuthorization()
storeReceipt()
updateAgentMemory()
pauseAgent()
```

Core events:

```txt
AgentRegistered
WalletFunded
WalletWithdrawn
FundsReserved
FundsReleased
PolicyCreated
CardRequestCreated
CardRequestApproved
CardRequestRejected
StripeCardLinked
Web3CardCreated
Web3SpendLogged
StripeAuthorizationLogged
ReceiptStored
AgentMemoryUpdated
AgentPaused
```

Hackathon proof:

- Deployed 0G contract address.
- 0G Explorer link showing activity.
- On-chain events for agent creation, policies, approvals, spends, and receipts.

## User Wallet And Deposit Layer

AgiCards needs a user-funded wallet layer because agents should not spend unlimited funds. Users deposit funds first, then delegate limited spending authority to agents through policies.

Deposit model:

```txt
User deposits funds
  -> Wallet balance increases
  -> Deposit event logs on 0G Chain
  -> Deposit receipt stores on 0G Storage
  -> User creates agent spending policy
  -> Agent can only request cards/spends within available delegated balance
```

MVP deposit options:

- 0G-native demo balance for hackathon testing.
- Test ERC-20/stablecoin contract on 0G Chain for Web3 card mode.
- Stripe test-mode funding simulation for real-card adapter mode.

Production deposit options:

- Stripe Issuing/Treasury or Financial Accounts funding where available.
- Stablecoin wallet funding if paired with a provider that supports stablecoin-backed issuing.
- External payment processor/top-up provider for fiat deposits.

Core wallet rules:

- Every agent card request must reserve funds before approval.
- Reserved funds cannot be used by another agent request.
- Rejected requests release reserved funds.
- Completed spends reduce available balance.
- Expired cards release unused funds.
- Human users can pause agents or withdraw unreserved funds.

Example:

```txt
User deposits $100.
Marketing Agent policy allows max $25 per request.
Agent requests $20 for a SaaS tool.
AgiCards reserves $20.
0G Compute checks the request.
User or policy approves it.
Stripe/Web3 card flow runs.
Receipt is stored on 0G Storage.
Spend is logged on 0G Chain.
Remaining available balance is $80.
```

## 0G Storage Integration

0G Storage stores data that should persist but should not all live directly on-chain.

Stored objects:

- Full agent profiles
- Deposit receipts
- Wallet balance snapshots
- Spending policy JSON
- Agent memory snapshots
- AI reasoning summaries
- Card request payloads
- Approval or rejection records
- Redacted Stripe card metadata
- Web3 card receipts
- Stripe webhook summaries
- Audit history

The smart contract stores hashes, roots, or references to the 0G Storage objects.

Important security rule:

Never store full card numbers, CVV, or sensitive Stripe secrets on 0G Storage.

Allowed card metadata:

```txt
stripe_card_id
last4
brand
status
cardholder_id
policy_id
agent_id
amount_limit
merchant/category rules
receipt hash
```

## 0G Compute Integration

0G Compute is used for agent intelligence and risk evaluation.

Use cases:

- Evaluate whether an agent request matches its policy.
- Score transaction risk.
- Summarize why the agent wants to spend.
- Decide whether to approve, reject, or require human approval.
- Generate a short audit explanation for the receipt.

Example output:

```json
{
  "decision": "requires_human_approval",
  "riskScore": 42,
  "reason": "The request matches the SaaS category but exceeds the auto-approval threshold."
}
```

This makes the project stronger than a basic smart contract and storage app.

## Persistent Memory Strategy

0G Persistent Memory is listed as coming soon, so AgiCards uses 0G Storage today as the persistent memory layer.

Current MVP:

- Store agent history, policies, spending behavior, and reasoning summaries on 0G Storage.
- Retrieve that data when the agent evaluates a new request.
- Update memory after each approval, rejection, or spend.

Future upgrade:

- When 0G Persistent Memory becomes available, migrate these memory records into the native 0G Persistent Memory module.
- Keep the same data model so migration is straightforward.

## Agent ID Strategy

Official 0G Agent ID should be integrated if the SDK/standard is available and usable during the build.

MVP fallback:

- Use a contract-level `agentId` generated by `AgiCardsRegistry`.
- Link that `agentId` to the owner wallet.
- Store encrypted or structured metadata on 0G Storage.
- Record all agent behavior and policy updates on 0G Chain.

Future upgrade:

- Replace or link the contract-level `agentId` with official 0G Agent ID.
- Use official Agent ID metadata, ownership, and composability features.

This keeps the MVP buildable while preserving a clear path to the official 0G Agent ID system.

## Privacy And Security

Security principles:

- Do not store full Stripe card number or CVV.
- Use Stripe Issuing Elements for secure card display in future real-card mode.
- Store only redacted card metadata.
- Store full policy and receipt objects on 0G Storage.
- Store hashes/references on 0G Chain.
- Use 0G Compute for risk checks.
- Add TEE-backed inference if available through 0G Compute providers.

Sensitive data handling:

```txt
Card number: Stripe only
CVV: Stripe only
Stripe secret key: backend env only
User deposits: 0G Chain event plus 0G Storage receipt
Reserved balances: backend/app state plus 0G Chain proof
Policy: 0G Storage
Policy hash: 0G Chain
Receipt: 0G Storage
Receipt hash: 0G Chain
Agent memory: 0G Storage
Agent ownership proof: 0G Chain
```

## Stripe Issuing Adapter

Stripe is used only as the real-card adapter for future production and test-mode demonstrations.

Stripe responsibilities:

- Create cardholders
- Create virtual cards
- Apply spending controls
- Receive authorization and transaction events
- Freeze or cancel cards
- Display card details securely through Issuing Elements

AgiCards responsibilities:

- Decide whether an agent is allowed to request a card.
- Store policy and approval proof on 0G.
- Store redacted Stripe metadata on 0G.
- Never expose raw Stripe secrets to the frontend.

Important limitation:

Stripe Issuing availability is restricted by country and program type. For the hackathon, AgiCards should use Stripe test mode or a mock Stripe adapter while keeping the production interface ready.

## Hybrid Spending Modes

### Mode 1: Stripe Real-Card Adapter

```txt
User deposit / funding source
  -> Agent request
  -> 0G Storage policy lookup
  -> 0G Compute risk check
  -> Reserve user funds
  -> Policy approval
  -> 0G Chain approval event
  -> Stripe test card creation
  -> Stripe webhook
  -> 0G Storage receipt
  -> 0G Chain receipt hash
```

This is the future-facing real-world spending path.

### Mode 2: 0G-Native Web3 Card

```txt
User deposits test token or 0G-native demo funds
  -> Agent request
  -> 0G Storage policy lookup
  -> 0G Compute risk check
  -> Reserve user funds
  -> Policy approval
  -> 0G Chain Web3 card creation
  -> Demo merchant payment
  -> 0G Storage receipt
  -> 0G Chain spend event
```

This is the hackathon-safe path that proves 0G integration deeply even if Stripe live access is restricted.

## Main User Flow

```txt
User connects wallet
  -> User deposits funds into AgiCards wallet
  -> User creates AI agent
  -> Agent profile stored on 0G Storage
  -> Agent registered on 0G Chain
  -> User creates spending policy
  -> Policy stored on 0G Storage
  -> Policy hash stored on 0G Chain
  -> Agent requests card or Web3 spend
  -> 0G Compute evaluates request
  -> AgiCards reserves delegated funds
  -> Policy engine approves/rejects/asks user
  -> Decision logged on 0G Chain
  -> Stripe adapter or Web3 card flow runs
  -> Receipt stored on 0G Storage
  -> Receipt hash logged on 0G Chain
  -> Dashboard shows proof links
```

## Hackathon Submission Mapping

Required submission proof:

- 0G contract address: `AgiCardsRegistry` deployed on 0G Chain.
- 0G Explorer link: transactions from agent creation, policies, approvals, and spends.
- 0G Storage proof: policy, memory, receipt roots/hashes.
- README: architecture, modules used, local setup, contract address, explorer links.
- Demo video: show full agent-to-card/spend flow and 0G proof.
- X post: include project name, screenshot/demo clip, required hashtags and tags.

0G modules used:

- 0G Chain: contract, events, proofs.
- 0G Storage: policies, receipts, memory, audit data.
- 0G Compute: AI/risk inference.
- Agent ID: official integration if available, contract-level identity for MVP.
- Persistent Memory: represented by 0G Storage today, native module later.
- Privacy/Security: redacted card metadata, Stripe Elements, TEE direction.

## Build Order

1. Scaffold frontend and backend.
2. Add wallet connection.
3. Build agent and policy UI.
4. Write `AgiCardsRegistry.sol`.
5. Add local contract tests.
6. Add 0G testnet deployment.
7. Add 0G Storage adapter.
8. Add 0G Compute adapter.
9. Add Web3 card mode.
10. Add Stripe test/mock adapter.
11. Add dashboard proof links.
12. Write README and architecture diagram.
13. Record demo video.
14. Push step-by-step commits to GitHub as the sole contributor.
