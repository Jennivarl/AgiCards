# Entry Point Map

> AgiCards | 14 entry points | 3 permissionless | 11 role-gated | 0 admin-only

---

## Protocol Flow Paths

### Setup (any user)

`depositFunds()` → `registerAgent()` → `createPolicy()`

### Card Request Lifecycle (Agent Owner)

`[setup above]` → `requestCard()`  ◄── availableBalance >= amount, policy active, agent not paused
                        ├─→ `approveCardRequest()`
                        │       ├─→ `linkStripeCard()`        ◄── stripeMode == true
                        │       │       └─→ `logStripeAuthorization()`  status → Completed
                        │       ├─→ `createWeb3Card()`        ◄── stripeMode == false
                        │       │       └─→ `logWeb3Spend()`            status → Completed
                        │       └─→ `releaseReservedFunds()`  status → Cancelled
                        └─→ `rejectCardRequest()`             status → Rejected; funds released

### Maintenance

`[agent registered]` → `pauseAgent()` / `updateAgentMemory()`  ◄── onlyAgentOwner

### Withdrawal

`[funds deposited]` → [any time, no pending requests needed] → `withdrawFunds()`  ◄── availableBalance >= amount

---

## Permissionless

### `AgiCardsRegistry.registerAgent()`

| Aspect | Detail |
|--------|--------|
| Visibility | external |
| Caller | Any address |
| Parameters | `agentId` (user-controlled), `metadataRoot` (user-controlled) |
| Call chain | → `agents[agentId] = Agent{...}` → emit `AgentRegistered` |
| State modified | `agents[agentId]` (owner, metadataRoot, paused=false, createdAt) |
| Value flow | None |
| Reentrancy guard | no |

### `AgiCardsRegistry.depositFunds()`

| Aspect | Detail |
|--------|--------|
| Visibility | external payable |
| Caller | Any address |
| Parameters | `receiptRoot` (user-controlled) |
| Call chain | → `depositedBalance[msg.sender] += msg.value` → emit `WalletFunded` |
| State modified | `depositedBalance[msg.sender]` |
| Value flow | Tokens: sender → contract (ETH) |
| Reentrancy guard | no |

### `AgiCardsRegistry.withdrawFunds()`

| Aspect | Detail |
|--------|--------|
| Visibility | external |
| Caller | Any address (withdraws their own balance) |
| Parameters | `amount` (user-controlled), `receiptRoot` (user-controlled) |
| Call chain | → `depositedBalance[msg.sender] -= amount` → emit `WalletWithdrawn` → `msg.sender.call{value: amount}("")` |
| State modified | `depositedBalance[msg.sender]` |
| Value flow | Tokens: contract → msg.sender (ETH) |
| Reentrancy guard | no |

---

## Role-Gated

### `onlyAgentOwner` — `agents[agentId].owner == msg.sender`

#### `AgiCardsRegistry.pauseAgent()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, onlyAgentOwner |
| Caller | Agent owner |
| Parameters | `agentId` (user-controlled), `paused` (user-controlled) |
| Call chain | → `agents[agentId].paused = paused` → emit `AgentPaused` |
| State modified | `agents[agentId].paused` |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.createPolicy()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, onlyAgentOwner |
| Caller | Agent owner |
| Parameters | `policyId` (user-controlled), `agentId` (user-controlled), `policyRoot` (user-controlled), `maxPerRequest` (user-controlled), `dailyLimit` (user-controlled) |
| Call chain | → `policies[policyId] = Policy{...}` → emit `PolicyCreated` |
| State modified | `policies[policyId]` (agentId, policyRoot, maxPerRequest, dailyLimit, active=true, createdAt) |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.setPolicyActive()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, onlyAgentOwner (via policy's agentId) |
| Caller | Owner of the agent linked to the policy |
| Parameters | `policyId` (user-controlled), `active` (user-controlled) |
| Call chain | → `policies[policyId].active = active` → emit `PolicyStatusChanged` |
| State modified | `policies[policyId].active` |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.requestCard()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, onlyAgentOwner |
| Caller | Agent owner |
| Parameters | `requestId` (user-controlled), `agentId` (user-controlled), `policyId` (user-controlled), `amount` (user-controlled), `requestRoot` (user-controlled), `stripeMode` (user-controlled) |
| Call chain | → checks policy/agent state → `reservedBalance[msg.sender] += amount` → `requests[requestId] = CardRequest{...}` → emit `FundsReserved`, `CardRequestCreated` |
| State modified | `reservedBalance[msg.sender]`, `requests[requestId]` |
| Value flow | None (ETH already in contract; funds earmarked) |
| Reentrancy guard | no |

#### `AgiCardsRegistry.updateAgentMemory()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, onlyAgentOwner |
| Caller | Agent owner |
| Parameters | `agentId` (user-controlled), `memoryRoot` (user-controlled) |
| Call chain | → emit `AgentMemoryUpdated` |
| State modified | None (event only) |
| Value flow | None |
| Reentrancy guard | no |

---

### `requestOwner` — `requests[requestId].owner == msg.sender`

Note: `requests[requestId].owner` is set to `msg.sender` in `requestCard`. The request creator and the approver/rejecter are always the same address.

#### `AgiCardsRegistry.approveCardRequest()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator (= agent owner who called requestCard) |
| Parameters | `requestId` (user-controlled), `decisionRoot` (user-controlled) |
| Call chain | → `requests[requestId].status = Approved` → emit `CardRequestApproved` |
| State modified | `requests[requestId].status` |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.rejectCardRequest()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled), `decisionRoot` (user-controlled) |
| Call chain | → `_releaseReserved(requestId)` → `requests[requestId].status = Rejected` → emit `CardRequestRejected` |
| State modified | `requests[requestId].status`, `requests[requestId].reservedAmount`, `reservedBalance[owner]` |
| Value flow | None (reserved ETH unlocked back to available) |
| Reentrancy guard | no |

#### `AgiCardsRegistry.linkStripeCard()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled), `stripeCardHash` (user-controlled), `cardMetadataRoot` (user-controlled) |
| Call chain | → emit `StripeCardLinked` (no state change beyond event) |
| State modified | None |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.createWeb3Card()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled), `web3CardId` (user-controlled), `cardMetadataRoot` (user-controlled) |
| Call chain | → emit `Web3CardCreated` (no state change beyond event) |
| State modified | None |
| Value flow | None |
| Reentrancy guard | no |

#### `AgiCardsRegistry.logWeb3Spend()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled), `amount` (user-controlled), `receiptRoot` (user-controlled) |
| Call chain | → `requests[requestId].status = Completed` → `_consumeReserved(requestId, amount)` → emit `Web3SpendLogged`, `ReceiptStored` |
| State modified | `requests[requestId].status`, `requests[requestId].reservedAmount`, `reservedBalance[owner]`, `depositedBalance[owner]` |
| Value flow | None (ETH deducted from depositedBalance; no transfer) |
| Reentrancy guard | no |

#### `AgiCardsRegistry.logStripeAuthorization()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled), `amount` (user-controlled), `receiptRoot` (user-controlled) |
| Call chain | → `requests[requestId].status = Completed` → `_consumeReserved(requestId, amount)` → emit `StripeAuthorizationLogged`, `ReceiptStored` |
| State modified | `requests[requestId].status`, `requests[requestId].reservedAmount`, `reservedBalance[owner]`, `depositedBalance[owner]` |
| Value flow | None (ETH deducted from depositedBalance; no transfer out) |
| Reentrancy guard | no |

#### `AgiCardsRegistry.releaseReservedFunds()`

| Aspect | Detail |
|--------|--------|
| Visibility | external, requestOwner |
| Caller | Request creator |
| Parameters | `requestId` (user-controlled) |
| Call chain | → `_releaseReserved(requestId)` → `requests[requestId].status = Cancelled` |
| State modified | `requests[requestId].status`, `requests[requestId].reservedAmount`, `reservedBalance[owner]` |
| Value flow | None (reserved ETH unlocked back to available) |
| Reentrancy guard | no |

---

## Admin-Only

No admin-only functions exist. There is no owner, no protocol admin, and no privileged role beyond resource ownership (`onlyAgentOwner`, `requestOwner`).
