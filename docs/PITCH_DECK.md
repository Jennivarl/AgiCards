# AgiCards — Pitch Deck
### 0G Hackathon Submission

---

## Slide 1 — Title

# AgiCards
**Controlled Spending for AI Agents**

> Programmable Web3 cards. Funded by users. Enforced by 0G.

- Live at: **agicards.dev**
- Contract: `0xc757698204543af249e328764e89530464de668e` · 0G Mainnet (Chain 16661)

---

## Slide 2 — The Problem

### AI agents can act. But can you trust them to spend?

| Gap | Reality |
|---|---|
| No spend limits | Agents can request any amount |
| No user control | No programmable guardrails |
| No on-chain proof | No audit trail of decisions |
| No accountability | Nothing stops a rogue agent |

**The agent economy is arriving. Payment infrastructure isn't ready.**

---

## Slide 3 — The Solution

### AgiCards: Spend controls that live on-chain

```
User deposits → Sets rules → Agent requests → 0G verifies → Proof recorded
```

- **Funded first, spent second** — agents can only draw from deposited wallets
- **Policy-bound** — every request checked against user-defined spend rules
- **Verifiably recorded** — each decision committed to 0G Storage and Chain
- **No trust required** — the chain enforces what you set

---

## Slide 4 — How It Works

**5-step flow:**

1. **Fund Wallet** — User deposits into a dedicated agent wallet
2. **Register Agent** — Agent identity anchored to 0G Storage (profile root)
3. **Set Spend Rules** — Policy hash committed to 0G Storage
4. **Agent Requests** — Card request evaluated against policy (0G Compute)
5. **Proof Recorded** — Decision root + receipt root stored on 0G Chain

Every step has a verifiable root. No black boxes.

---

## Slide 5 — 0G Integration (Technical Depth)

### Four 0G layers, all live on mainnet

| Layer | What We Use It For |
|---|---|
| **0G Chain** (16661) | Smart contract deployment, spend event anchoring |
| **0G Storage** | Agent profiles, spend policies, request receipts, memory |
| **0G Compute** | AI policy reasoning — evaluates each card request |
| **0G Explorer** | Public verifiability of every proof root |

**All roots are live. All proofs are real. No mocked data.**

---

## Slide 6 — Live Proof on Mainnet

Contract deployed at:
```
0xc757698204543af249e328764e89530464de668e
```
Chain 16661 · 0G Mainnet

| Proof Event | Storage Root |
|---|---|
| Agent Profile | `0xa9639b81ba042c45c8ba6d13b73a53110fc83be9e3067123cf933f7bd4de5140` |
| Spend Policy | `0xa9b39fc3e22c39058822aeee69800eeb6bfc83c5ca2b95201611886e8a6c1b1e` |
| Request Receipt | `0x5e8041c243afa263814d01c01c776876056d0369dae358f413c787c6e4dfa752` |
| Compute Decision | `0xa12eb9cfe85854f721aeaf36230a7d562bc376b9635fe2bddf490f40dad7773f` |
| Agent Memory | `0xf599f6a4430673f2ecc201e0216248f3ae540d0991d8a0ae3bee31181d331e6b` |

**Verifiable at:** https://chainscan.0g.ai/address/0xc757698204543af249e328764e89530464de668e

---

## Slide 7 — Product Demo

**Live MVP at agicards.dev**

| Page | What It Shows |
|---|---|
| Landing | Spend flow, 0G proof band, virtual card preview |
| Dashboard | Agent state, spend policy, 0G layer status |
| Agents | Agent wallet registration |
| Wallet | User deposit controls |
| 0G Layer | All proof roots, contract address, explorer link |

**The 0G Layer page is built specifically for judges** — every proof in one place, zero hunting.

---

## Slide 8 — What's Live vs Roadmap

### Now (MVP)
- Web3 virtual card controls on 0G Mainnet
- User-funded wallet with policy enforcement
- Agent identity + spend proof recorded via 0G Storage
- AI policy evaluation via 0G Compute
- Public proof explorer page

### Roadmap
- Stripe adapter for issuer-backed card programmes
- Agent identity standard (0G-native DID)
- Privacy layer via 0G secure execution
- Multi-agent spend delegation

---

## Slide 9 — Why This Matters

### The agent economy needs payment rails

- **OpenAI, Anthropic, Google** are all building autonomous agents
- Agents need to buy: compute, APIs, subscriptions, services
- Today: no programmable, verifiable spend infrastructure exists
- **AgiCards is the first-mover in on-chain AI agent payment controls**

0G is the only chain where this is possible at this fidelity:
Storage + Compute + Chain in one ecosystem — no stitching required.

---

## Slide 10 — The Ask

### AgiCards — 0G Hackathon Submission

**Built by:** varl999 (solo)
**Stack:** Next.js 15 · Solidity · 0G Chain · 0G Storage · 0G Compute
**Live at:** agicards.dev
**Proof:** agicards.dev/app/proof

> Agents can spend, but only inside the rules you set.
> And now, that rule is enforced on-chain.
