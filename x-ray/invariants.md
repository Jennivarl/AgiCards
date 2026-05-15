# Invariant Map

> AgiCards | 15 guards | 7 inferred | 2 not enforced on-chain (I-3, I-4)

---

## 1. Enforced Guards (Reference)

Per-call preconditions. Heading IDs below (`G-N`) are anchor targets from x-ray.md attack surfaces.

#### G-1
`require(agentId != bytes32(0), "invalid agent id")` · `AgiCardsRegistry.sol:85` · prevents the zero bytes32 from being used as a sentinel, keeping `agents[agentId].owner == address(0)` reliable as the "unregistered" check

#### G-2
`require(agents[agentId].owner == address(0), "agent exists")` · `AgiCardsRegistry.sol:86` · enforces the one-shot registration latch — an agentId can only be claimed once

#### G-3
`require(msg.value > 0, "no value")` · `AgiCardsRegistry.sol:104` · ensures every deposit call actually adds ETH to the escrow

#### G-4
`require(amount > 0, "invalid amount")` · `AgiCardsRegistry.sol:110` · withdrawFunds — prevents zero-withdrawal no-ops from polluting the event log

#### G-5
`require(availableBalance(msg.sender) >= amount, "insufficient available")` · `AgiCardsRegistry.sol:111` · withdrawFunds — enforces the Conservation invariant I-1 at the withdrawal boundary

#### G-6
`require(policyId != bytes32(0), "invalid policy id")` · `AgiCardsRegistry.sol:127` · mirrors G-1 for policy identifiers

#### G-7
`require(policies[policyId].createdAt == 0, "policy exists")` · `AgiCardsRegistry.sol:128` · one-shot latch for policy creation; policyId cannot be reused

#### G-8
`require(maxPerRequest > 0, "invalid max")` · `AgiCardsRegistry.sol:129` · ensures the per-request cap is a positive bound; prevents policies that block all spending

#### G-9
`require(dailyLimit >= maxPerRequest, "daily below max")` · `AgiCardsRegistry.sol:130` · at creation enforces dailyLimit ≥ maxPerRequest; note this check is NOT repeated anywhere that reads the policy — see I-3

#### G-10
`require(requests[requestId].createdAt == 0, "request exists")` · `AgiCardsRegistry.sol:164` · one-shot latch preventing requestId reuse or replay

#### G-11
`require(amount <= policy.maxPerRequest, "over max request")` · `AgiCardsRegistry.sol:166` · enforces the per-request cap for every new card request — the only on-chain limit check for spend amount

#### G-12
`require(availableBalance(msg.sender) >= amount, "insufficient funds")` · `AgiCardsRegistry.sol:167` · requestCard — enforces Conservation I-1 before reserving funds

#### G-13
`require(cardRequest.status == RequestStatus.Pending, "not pending")` · `AgiCardsRegistry.sol:189` (approve) / `AgiCardsRegistry.sol:196` (reject) · guards the Pending→Approved and Pending→Rejected state edges

#### G-14
`require(cardRequest.status == RequestStatus.Approved, "not approved")` · `AgiCardsRegistry.sol:209` (linkStripe) / `AgiCardsRegistry.sol:221` (createWeb3) / `AgiCardsRegistry.sol:229` (logWeb3Spend) / `AgiCardsRegistry.sol:241` (logStripeAuth) · gates all post-approval actions on the Approved state

#### G-15
`require(cardRequest.status == RequestStatus.Pending || cardRequest.status == RequestStatus.Approved, "cannot release")` · `AgiCardsRegistry.sol:254–256` · prevents release of funds from terminal-state requests

---

## 2. Inferred Invariants (Single-Contract)

---

#### I-1

`Conservation` · On-chain: **Yes**

> For every address `u`: `depositedBalance[u] >= reservedBalance[u]` at all times

**Derivation** — Δ-pair analysis across all write sites:
- `depositFunds`: `Δ(depositedBalance[u]) = +msg.value`, `reservedBalance` unchanged → gap widens ✓
- `withdrawFunds`: `Δ(depositedBalance[u]) = -amount` where guard G-5 ensures `amount <= depositedBalance - reservedBalance` → gap preserved ✓
- `requestCard`: `Δ(reservedBalance[u]) = +amount` where guard G-12 ensures `amount <= depositedBalance - reservedBalance` → gap preserved ✓
- `_releaseReserved`: `Δ(reservedBalance[u]) = -amount` → gap widens ✓
- `_consumeReserved`: `Δ(reservedBalance[u]) = -reservedAmount`, `Δ(depositedBalance[u]) = -spentAmount` where `spentAmount <= reservedAmount` → net change to gap is `reservedAmount - spentAmount >= 0` ✓

**If violated** — `availableBalance` underflows; `withdrawFunds` would allow over-withdrawal; contract ETH balance could be drained below user liabilities

---

#### I-2

`Ratio` · On-chain: **Yes**

> `availableBalance(u) = depositedBalance[u] - reservedBalance[u]`

**Derivation** — Definition at `AgiCardsRegistry.sol:268`; `availableBalance` is a pure computation with no independent storage. Every check (`G-5`, `G-12`) uses this function directly.

**If violated** — not possible to violate independently of I-1; if `depositedBalance < reservedBalance` the subtraction underflows (Solidity 0.8 revert)

---

#### I-3

`Bound` · On-chain: **No**

> Policy's `dailyLimit` is never enforced after creation — there is no on-chain mechanism preventing a user from submitting multiple requests totalling more than `dailyLimit` in a single day

**Derivation** — guard-lift: `G-9` checks `dailyLimit >= maxPerRequest` at `createPolicy:130`. Write site enumeration for `dailyLimit`: only written once at creation (`createPolicy:136`), never read again in any subsequent function (`requestCard:158–184` loads a `Policy memory` but only accesses `.active`, `.agentId`, `.maxPerRequest`). No write site enforces a daily-total check. The gap: `requestCard` enforces only `amount <= maxPerRequest` (G-11), not any cumulative daily cap.

**If violated** — users can submit N requests in one day each at `maxPerRequest`, totalling N × maxPerRequest even when `dailyLimit < N × maxPerRequest`; off-chain compute (0G Compute) may enforce the intent, but the on-chain contract does not

---

#### I-4

`Bound` · On-chain: **No**

> Every spend log (`logWeb3Spend`, `logStripeAuthorization`) should record a positive spend amount; the contract does not enforce `amount > 0` for these calls

**Derivation** — guard-lift: `depositFunds:104` has G-3 (`amount > 0`); `withdrawFunds:110` has G-4 (`amount > 0`); `requestCard:165` has `require(amount > 0)`. However, `logWeb3Spend:229` and `logStripeAuthorization:243` only check `amount <= cardRequest.reservedAmount` (G-14 variant) with no lower bound. When `amount = 0`, `_consumeReserved(requestId, 0)` is called: `spentAmount = 0`, `unusedAmount = reservedAmount`, `depositedBalance[owner] -= 0` (no-op), `reservedBalance[owner] -= reservedAmount` (full release), `status → Completed`. The gap: a zero-spend completion marks the request finished while recovering all reserved ETH, producing a receipt log with 0 value.

**If violated** — request can be closed with no actual ETH spent; off-chain audit trail records a spend event at 0 amount; the `ReceiptStored` event will reference a user-supplied `receiptRoot` with no corresponding economic activity

---

#### I-5

`StateMachine` · On-chain: **Yes**

> `agents[agentId].owner` is a one-shot latch: once set from `address(0)` to a concrete address, it cannot be changed

**Derivation** — edge: `address(0)@L86 → msg.sender@L89`. Confirmed no reverse path: no function in scope writes `agents[agentId].owner` after `registerAgent`. No `transferAgent` or `updateAgent` setter exists. The `pauseAgent` and `updateAgentMemory` functions only modify `paused` and emit an event respectively; neither touches `owner`.

**If violated** — agent ownership cannot be transferred; the immutability is intentional but means a lost key permanently forfeits control of all policies and requests linked to that agentId

---

#### I-6

`StateMachine` · On-chain: **Yes**

> Request status transitions are one-directional: `Pending → Approved`, `Pending → Rejected`, `Pending|Approved → Cancelled`, `Approved → Completed`; no backward edge exists

**Derivation** — edge enumeration:
- `approveCardRequest:190`: `Pending → Approved` (G-13 gates)
- `rejectCardRequest:199`: `Pending → Rejected` (G-13 gates)
- `logWeb3Spend:232`: `Approved → Completed` (G-14 gates)
- `logStripeAuthorization:245`: `Approved → Completed` (G-14 gates)
- `releaseReservedFunds:260`: `Pending|Approved → Cancelled` (G-15 gates)

No function writes status back from a terminal state (Rejected, Completed, Cancelled) or from Approved back to Pending. Confirmed by full source scan — only these 5 functions write `requests[requestId].status`.

**If violated** — a double-execution of a completed request could double-spend or double-release reserved funds; G-14 and G-15 prevent this on-chain

---

#### I-7

`Temporal` · On-chain: **Yes**

> `agents[agentId].createdAt`, `policies[policyId].createdAt`, and `requests[requestId].createdAt` are used as binary existence flags (0 = unregistered, nonzero = registered); they encode creation time but their primary role is collision prevention

**Derivation** — temporal: `createdAt = block.timestamp` set at `registerAgent:92`, `createPolicy:139`, `requestCard:178`. Checked as `== 0` (G-2-equivalent for policy/request) at `createPolicy:128` and `requestCard:164`. No function uses the timestamp value arithmetically after creation — no expiry, no freshness check, no duration calculation.

**If violated** — if `block.timestamp` returns 0 (not possible in practice), an entity could be re-registered, overwriting the existing record; not a realistic risk under normal EVM conditions

---

**Categories:**
- **Conservation**: Equal-and-opposite Δ across function body → `A + B = const`
- **Bound**: Guard lifted to global property across all write sites → `x ∈ [0, MAX]` globally; On-chain=No if any write site lacks equivalent guard
- **Ratio**: Storage variable defined as formula of other storage variables
- **StateMachine**: Discrete-value transitions with no reverse path
- **Temporal**: Condition depends on `block.timestamp`, `block.number`, or deadline

---

## 3. Inferred Invariants (Cross-Contract)

No in-scope cross-contract calls. The only external interaction is `msg.sender.call{value:amount}("")` in `withdrawFunds`, where `msg.sender` is an out-of-scope EOA or contract. No cross-contract invariants can be derived within this scope.

---

## 4. Economic Invariants

---

#### E-1

On-chain: **Yes**

> For any user `u`, `reservedBalance[u]` equals the sum of `requests[r].reservedAmount` for all requests `r` where `requests[r].owner == u` and `requests[r].reservedAmount > 0`

**Follows from** — `I-1` + `I-6`

Every path that changes `reservedBalance[u]` also zeroes `requests[r].reservedAmount` in the same function body:
- `requestCard`: `reservedBalance += amount` paired with `requests[id].reservedAmount = amount` (Δ-pair: AgiCardsRegistry.sol:169 ↔ AgiCardsRegistry.sol:175)
- `_releaseReserved`: `reservedBalance -= amount` paired with `requests[id].reservedAmount = 0` (AgiCardsRegistry.sol:277 ↔ AgiCardsRegistry.sol:276)
- `_consumeReserved`: `reservedBalance -= reservedAmount` paired with `requests[id].reservedAmount = 0` (AgiCardsRegistry.sol:288 ↔ AgiCardsRegistry.sol:287)

The state machine (I-6) ensures no terminal request can be re-processed, preventing double-release.

**If violated** — `reservedBalance` could drift from the sum of active `reservedAmount` values, making `availableBalance` inaccurate and potentially allowing over-withdrawal
