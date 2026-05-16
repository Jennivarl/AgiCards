> AgiCards | 245 nSLOC | f47acfa (`main`) | custom (no Foundry/Hardhat config) | 15/05/26
> Auditor: Mustapha Abdulaziz · [@mustaphaabdulazizdambatta](https://github.com/mustaphaabdulazizdambatta) · mustaphaabdulaziz001@gmail.com


## 1. Protocol Overview

**What it does:** A single-contract ETH escrow and proof registry that lets users fund a wallet, register AI agents, set spending policies, and authorize card-spend requests, with every action anchored by a 0G Merkle root.

- **Users**: Agent owners — they deposit ETH, define agents and policies, create card requests, and approve their own requests
- **Core flow**: `depositFunds` → `registerAgent` → `createPolicy` → `requestCard` → `approveCardRequest` → `logWeb3Spend` or `logStripeAuthorization`
- **Key mechanism**: ETH is held as escrowed `depositedBalance`; `reservedBalance` earmarks a portion per pending/approved request; spending consumes the reserved amount from `depositedBalance`
- **Token model**: Native ETH only — no ERC-20 tokens; balances tracked in two mappings (`depositedBalance`, `reservedBalance`)
- **Admin model**: No protocol admin or owner role; every action is gated only by resource ownership (`onlyAgentOwner`, `requestOwner`)

For a visual overview, see the [architecture diagram](architecture.svg).

### Contracts in Scope

| Subsystem | Key Contracts | nSLOC | Role |
|-----------|--------------|------:|------|
| Registry + Escrow | AgiCardsRegistry | 245 | Holds ETH, registers agents/policies, gates request lifecycle |

### How It Fits Together

The core trick: ETH stays in the contract; `reservedBalance` earmarks a sub-portion so `availableBalance = depositedBalance − reservedBalance` always reflects what the user can still move or spend.

### Deposit & Withdraw

```
User
  └─ depositFunds(receiptRoot)  ← msg.value added to depositedBalance[msg.sender]
  └─ withdrawFunds(amount)      ← depositedBalance -= amount; then .call{value}("") to user
```

### Card Request Lifecycle

```
Agent Owner
  └─ requestCard(requestId, agentId, policyId, amount, ...)
       ├─ checks: !agent.paused, policy.active, agentId match, amount <= maxPerRequest, availableBalance >= amount
       ├─ reservedBalance[msg.sender] += amount
       └─ status → Pending
           ├─ approveCardRequest()  status → Approved
           │    └─ linkStripeCard() / createWeb3Card()
           │         └─ logStripeAuthorization() / logWeb3Spend()  status → Completed; _consumeReserved()
           ├─ rejectCardRequest()   status → Rejected;  _releaseReserved()
           └─ releaseReservedFunds() status → Cancelled; _releaseReserved()
```

### Reserved-to-Consumed Accounting

```
_consumeReserved(requestId, spentAmount)
  ├─ reservedAmount = cardRequest.reservedAmount
  ├─ unusedAmount   = reservedAmount - spentAmount
  ├─ cardRequest.reservedAmount = 0
  ├─ reservedBalance[owner]  -= reservedAmount   ← full reserved cleared
  └─ depositedBalance[owner] -= spentAmount      ← only actual spend debited
       └─ if unusedAmount > 0 → emit FundsReleased
```

---

## 2. Threat & Trust Model

> **Bullet brevity rule**: one tight sentence per bullet.

### Protocol Threat Profile

> Protocol classified as: **Escrow/Registry** (no standard DeFi type match — nearest pattern is custody + state-machine authorization)

Single-contract, no oracle, no AMM, no governance. The ETH escrow is the primary value-holding surface; every other function mutates proof roots and request state. Standard DeFi adversary rankings do not directly apply; threats are dominated by logic bugs in fund accounting, self-service abuse, and single-key risk.

### Actors & Adversary Model

| Actor | Trust Level | Capabilities |
|-------|-------------|-------------|
| User / Agent Owner | Self-trusted (controls their own funds and agents only) | Deposit ETH, withdraw available balance, register agents, create policies, submit card requests, approve/reject/cancel their own requests, log spend, update agent memory. All actions instant; no delay. |
| Contract | Deterministic | Holds ETH in escrow; enforces CEI on withdrawal; emits proof roots |

No protocol admin exists. No multisig, no timelock, no pause mechanism.

**Adversary Ranking:**

1. **Logic-exploiting user** — Can construct zero-spend completions, bypass daily limits, or finalize Stripe-mode requests via the Web3 log path due to missing guards.
2. **Front-running registrant** — User-supplied `agentId` in `registerAgent` allows a watcher to squat a predictable identifier before the intended owner.
3. **Reentrancy attacker** — `withdrawFunds` uses low-level `.call` with no reentrancy guard; CEI is followed but cross-function paths through `requestCard` warrant tracing.

See [entry-points.md](entry-points.md) for the full permissionless entry point map.

### Trust Boundaries

- **User ↔ Registry** — User supplies all bytes32 identifiers (`agentId`, `policyId`, `requestId`); the contract checks uniqueness but not semantic validity. Worst instant action: register the zero agentId (prevented by guard) or an adversarially chosen collision. *No timelock; all actions immediate.*
- **Request approval boundary** — `requestOwner` modifier is the sole gatekeeper for both request creation and approval: the same EOA signs both sides. The approval step provides no independent security guarantee. *Git signal: all 296 source lines arrived in 1 commit with no test-file co-change (a3409bb); no prior review history.*

### Key Attack Surfaces

- **Self-approval pattern** &nbsp;&#91;[I-6](invariants.md#i-6)&#93; — `requestCard` stores `owner: msg.sender` (L170); `approveCardRequest` checks `requestOwner(requestId)` = same address (L79–81, L186); worth confirming whether the approval step provides any security guarantee independent of the requester.

- **Zero-spend completion** &nbsp;&#91;[I-4](invariants.md#i-4)&#93; — `logWeb3Spend:229` and `logStripeAuthorization:243` check `amount <= reservedAmount` but not `amount > 0`; `_consumeReserved(requestId, 0)` sets `status = Completed`, clears reserved, and debits `depositedBalance` by zero; worth tracing whether a user can mark requests complete with no real spend while recovering all reserved ETH.

- **`dailyLimit` not enforced on-chain** &nbsp;&#91;[I-3](invariants.md#i-3)&#93; — `Policy.dailyLimit` is written in `createPolicy` (L136) and validated `dailyLimit >= maxPerRequest` (L130), but `requestCard` only checks `amount <= policy.maxPerRequest` (L166); `dailyLimit` is never read after creation; worth confirming whether this is by design or an oversight.

- **`logWeb3Spend` missing mode check** — `createWeb3Card:222` enforces `!cardRequest.stripeMode` but `logWeb3Spend:227–237` has no mode check; a Stripe-mode request can bypass `linkStripeCard` and be finalized via the Web3 spend path; worth tracing the full Stripe-mode lifecycle to confirm whether this creates a divergent audit trail.

- **ETH withdrawal via low-level `.call`** — `withdrawFunds:116` uses `msg.sender.call{value: amount}("")` with no `nonReentrant` guard; `depositedBalance` is decremented first (CEI, L113) but no cross-function reentrancy protection exists; worth tracing whether a callback from a malicious EOA can re-enter `requestCard` between the state update and the transfer.

- **`agentId` squatting** — `registerAgent:84` is permissionless and accepts any caller-supplied `bytes32 agentId`; worth checking whether the frontend generates predictable identifiers (e.g., `keccak256(address)`) that could be front-run to deny agent registration.

- **Agent pause does not gate in-flight requests** — `pauseAgent:98` sets `agents[agentId].paused = true`; only `requestCard:161` checks this flag; `approveCardRequest`, `logWeb3Spend`, and `logStripeAuthorization` proceed regardless of pause status; worth confirming intended semantics.

### Protocol-Type Concerns

**As an Escrow / Registry:**
- `withdrawFunds:109–118` uses a two-step balance check then external call; the absence of a reentrancy guard means the security depends entirely on `depositedBalance` being decremented before the call — worth confirming that every future code path touching `depositedBalance` maintains CEI.
- `_consumeReserved:285–289`: `depositedBalance[owner] -= spentAmount` where `spentAmount` could be 0; Solidity 0.8 underflow protection won't trigger but the accounting silently produces a no-op spend debit; worth checking whether this is the intended behaviour for zero-spend completions.

### Temporal Risk Profile

**Deployment & Initialization:**
- No constructor or `initialize()` exists; the contract is stateless at deploy with no ownership transfer step needed — no front-running risk at initialization.
- No `agentId` is pre-assigned; any permissionless caller can claim any identifier immediately after deployment; worth checking whether the frontend's identifier scheme provides collision resistance in a competitive mempool.

### Composability & Dependency Risks

> **`msg.sender.call{value: amount}`** — via `AgiCardsRegistry.withdrawFunds:116`
> - Assumes: recipient is a cooperative EOA or non-reentrant contract
> - Validates: return bool `sent` checked; `depositedBalance` decremented before call
> - Mutability: caller-controlled (any EOA or contract can be the recipient)
> - On failure: `require(sent, "withdraw failed")` reverts the transaction

**Token Assumptions:**
- Native ETH only; no ERC-20 transfer assumptions; no fee-on-transfer or rebasing risk.

---

## 3. Invariants

> ### 📋 Full invariant map: **[invariants.md](invariants.md)**
>
> A dedicated reference file contains the complete invariant analysis.
>
> - **15 Enforced Guards** (`G-1` … `G-15`) — per-call preconditions with `Check` / `Location` / `Purpose`
> - **7 Single-Contract Invariants** (`I-1` … `I-7`) — Conservation, Bound, Ratio, StateMachine, Temporal
> - **0 Cross-Contract Invariants** — no in-scope cross-contract calls
> - **1 Economic Invariant** (`E-1`) — derives from I-1 + I-2
>
> The **On-chain=No** blocks are the high-signal ones: `I-3` (dailyLimit gap), `I-4` (zero-spend gap). Attack-surface bullets above cross-link directly into the relevant blocks.

---

## 4. Documentation Quality

| Aspect | Status | Notes |
|--------|--------|-------|
| README | Present | README.md — covers flow, 0G modules, deployment proof |
| NatSpec | ~2 annotations | `@title` and `@notice` on contract; no function-level NatSpec |
| Spec/Whitepaper | Missing | No formal spec; docs/ARCHITECTURE.md provides a flow summary |
| Inline Comments | Sparse | No inline comments in function bodies; struct fields undocumented |

---

## 5. Test Analysis

| Metric | Value | Source |
|--------|-------|--------|
| Test files | 1 | File scan (always reliable) |
| Test functions | 0 detected (grep -P failed) | File scan |
| Line coverage | Unavailable — no Hardhat config | Coverage tool |
| Branch coverage | Unavailable — no Hardhat config | Coverage tool |

**Important**: The 1 test file (`tests/policyEngine.test.ts`) tests the off-chain TypeScript policy engine (`lib/policyEngine.ts`), not the Solidity contract. The Solidity contract has **no test files**.

### Test Depth

| Category | Count | Contracts Covered |
|----------|-------|-------------------|
| Unit (off-chain TS) | 1 file | lib/policyEngine.ts only |
| Unit (Solidity) | 0 | None |
| Stateless Fuzz | 0 | None |
| Stateful Fuzz | 0 | None |
| Formal Verification | 0 | None |

### Gaps

- **No Solidity tests at all** — `AgiCardsRegistry.sol` has zero test coverage; all fund-handling paths (`depositFunds`, `withdrawFunds`, `_consumeReserved`) are untested on-chain.
- No fuzz testing for the accounting invariants (`availableBalance`, reserved ↔ deposited conservation).
- No formal verification for the state machine transitions (request lifecycle).


### Contributors

| Author | Commits | Source Lines (+/-) | % of Source Changes |
|--------|--------:|--------------------|--------------------:|
| varl999 | 35 | +296 / -0 | 100% |

### Review & Process Signals

| Signal | Value | Assessment |
|--------|-------|------------|
| Unique contributors | 1 | Single-developer project |
| Merge commits | 0 of 35 (0%) | No merge commits — no formal peer review |
| Repo age | 2026-05-15 → 2026-05-15 | Same-day repository |
| Recent source activity (30d) | 1 commit | All source added in single burst |
| Test co-change rate | 0% | No Solidity test file co-modification in any commit (measures file co-modification, not coverage) |

### File Hotspots

| File | Modifications | Note |
|------|-------------:|------|
| contracts/AgiCardsRegistry.sol | 1 | Single commit — no churn history; no baseline for regression tracking |

### Security-Relevant Commits

**Score** = weighted sum of fix-like signals. Score ≥ 5 warrants a manual diff.

| SHA | Date | Subject | Score | Key Signal |
|-----|------|---------|------:|------------|
| a3409bb | 2026-05-15 | Scaffold AgiCards MVP | 11 | Adds runtime guards, token transfer logic, accounting/balance logic; spans access_control + fund_flows + state_machines |

### Dangerous Area Evolution

| Security Area | Commits | Key Files |
|--------------|--------:|-----------|
| access_control | 1 | contracts/AgiCardsRegistry.sol |
| fund_flows | 1 | contracts/AgiCardsRegistry.sol |
| state_machines | 1 | contracts/AgiCardsRegistry.sol |

### Cross-Reference Synthesis

- **AgiCardsRegistry.sol is the only file AND the only attack surface** — every surface (self-approval, zero-spend, dailyLimit gap) routes through it → review `requestCard`, `_consumeReserved`, `logWeb3Spend`, `logStripeAuthorization` first.
- **Zero test + zero review + single commit → I-4 (On-chain=No) is the highest-priority finding** — the zero-spend gap has never been tested or peer-reviewed; `_consumeReserved` with `spentAmount=0` is unverified at every level.
- **Self-approval design (I-6) aligns with zero peer review** — the architecture choice that removes independent approval may be intentional (user controls their own agent) but warrants explicit doc confirmation given no review trail.

**EXPOSED** — single-developer codebase with no Solidity tests, no NatSpec on any function, no peer review, and two On-chain=No accounting gaps (`I-3`, `I-4`) in core fund-flow paths.

**Structural facts:**
1. 245 nSLOC in 1 contract; deployed on 0G Mainnet (0xc757698204543af249e328764e89530464de668e)
2. 0 Solidity test functions; 0% test coverage of on-chain code
3. 1 developer wrote 100% of source code; 0 merge commits
4. No admin role; no timelock; no pause mechanism
5. Two On-chain=No invariants: `I-3` (dailyLimit never enforced) and `I-4` (zero-spend completions possible)
