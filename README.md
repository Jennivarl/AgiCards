# AgiCards

**Permission cards for AI agents.** Give your agent controlled on-chain powers — within limits the blockchain itself enforces.

🔗 **Live app:** [agicards.dev](https://agicards.dev) · 🎤 **Pitch deck:** [Canva](https://canva.link/zmsa35v5h1axhom)

Built for the **MetaMask Smart Accounts Kit** track, on **Base** mainnet.

---

## The problem

AI agents are starting to pay for things on their own — APIs, tools, subscriptions. But there's no safe way to let them.

Today you have two bad options:

- Give the agent your private key, and it can drain your whole wallet.
- Approve every single payment by hand, which defeats the point of an agent.

There's no safe middle ground.

## The solution

AgiCards gives your agent a **permission card**. The agent can spend, but only inside limits you set: a daily cap, an expiry, and what it's allowed to pay for. Your money never leaves your own MetaMask Smart Account, and you can switch the card off anytime.

---

## How it works

1. **Grant.** You describe a card in plain English (for example, *"pay for cloud compute, $1 a day, $0.20 per charge"*). AgiCards turns that into limits and asks MetaMask for **one Advanced Permission** (ERC-7715): a daily USDC cap with an expiry, granted to the agent's key. Approving it also upgrades your account to an **EIP-7702** smart account.
2. **Enforce.** The cap and expiry are checked by the account's **caveat enforcer on-chain**, not by a server. The agent can never exceed them.
3. **Redeem.** A background agent **redeems the delegation** (ERC-7710) to run the action — for example, a USDC payment through x402 — on your behalf and inside the caveat. You don't sign each time.
4. **Audit.** Every execution is recorded to **0G Storage**, giving a verifiable, tamper-evident trail.

The card is revocable at any moment. Revoking removes the permission immediately.

---

## What it does today

- **Pay-per-use and subscriptions** in USDC (x402) — the agent pays once, or on a repeating schedule, all inside the on-chain cap.
- **One-click revoke** and a **live spend meter** per card.
- **Audit trail** of every payment.

**On the roadmap** (the same card model, more powers): swaps, trades, prediction markets, yield actions, NFT bids, and data purchases.

---

## Built with

| Area | Tech |
| --- | --- |
| Smart accounts | MetaMask Smart Accounts Kit — Advanced Permissions (ERC-7715), delegation (ERC-7710), EIP-7702 |
| Network | Base mainnet · USDC |
| Payments | x402 (pay-per-use) |
| Audit | 0G Storage |
| App | Next.js 15 (App Router), React 19, TypeScript, viem |
| Data | Postgres (Neon) |

> Granting an Advanced Permission needs **MetaMask Flask**. Everything else (minting, viewing, revoking) works in regular MetaMask.

---

## Project structure

```
app/
  page.tsx              # the app, served at the site root (agicards.dev)
  layout.tsx
  studio/_design/       # UI — landing, dashboard, card detail, create, settings
  api/v2/               # API — cards, execute, revoke, intent, executions, status
lib/v2/
  grantCard.ts          # builds the ERC-7715 permission request
  transport.ts          # redeems the ERC-7710 delegation on-chain
  skills/               # what a card can do (x402 pay, Uniswap swap)
  parseIntent.ts        # plain English -> spending limits
  storage.ts            # 0G Storage audit trail
  chains.ts, tokens.ts  # Base + USDC config
scripts/                # agent wallet setup helpers
```

---

## Run it locally

```bash
git clone https://github.com/Jennivarl/AgiCards.git
cd AgiCards
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment variables

See [`.env.example`](.env.example) for the full list. The important ones:

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | Postgres (Neon) — where cards are stored. Without it, cards live in memory and reset on restart. |
| `AGENT_LOCAL_PRIVATE_KEY` | The agent's key. It redeems the delegation and pays gas, so its address needs a little Base ETH. |
| `EXECUTION_TRANSPORT` | `wallet` for real on-chain spends, or `simulated` for a dry run. |
| `NEXT_PUBLIC_BASE_RPC_URL` | Optional Base RPC URL (a default is used otherwise). |
| `OG_STORAGE_PRIVATE_KEY` | Optional — enables the real 0G audit trail (a mock root is used otherwise). |

Agent wallet setup helpers live in [`scripts/`](scripts/).

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | Type-check with no emit |
