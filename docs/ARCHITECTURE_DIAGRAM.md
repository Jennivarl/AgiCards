# Architecture Diagram

```mermaid
flowchart TD
  User[User Wallet] --> Deposit[Deposit Funds]
  User --> AgentForm[Generate Agent]

  Deposit --> Wallet[AgiCards Wallet Balance]
  AgentForm --> AgentProfile[Agent Profile]
  AgentForm --> Policy[Spending Policy]

  AgentProfile --> Storage1[0G Storage: Agent + Memory]
  Policy --> Storage2[0G Storage: Policy JSON]
  AgentProfile --> Chain1[0G Chain: AgentRegistered]
  Policy --> Chain2[0G Chain: PolicyCreated]

  Wallet --> Request[Agent Card Order]
  Policy --> Request
  Request --> Compute[0G Compute: Risk + Policy Decision]

  Compute -->|Approved| Reserve[Reserve Funds]
  Compute -->|Rejected| Reject[Reject Request]
  Compute -->|Review| Human[Human Approval]

  Human --> Reserve
  Reserve --> Mode{Spend Mode}

  Mode --> Stripe[Stripe Adapter: Future Real Card]
  Mode --> Web3[0G Web3 Card: MVP Spend Flow]

  Stripe --> Receipt[Redacted Receipt]
  Web3 --> Receipt

  Receipt --> Storage3[0G Storage: Receipt + Audit]
  Receipt --> Chain3[0G Chain: Spend + Receipt Proof]

  Chain1 --> Explorer[0G Explorer Proof]
  Chain2 --> Explorer
  Chain3 --> Explorer
```

## Plain English

AgiCards has two spending paths:

- Stripe adapter for future real-card issuing where supported.
- 0G-native Web3 card flow for the working hackathon MVP.

0G is used for:

- Chain proof of agents, policies, deposits, approvals, and spends.
- Storage of policies, receipts, memory, and audit records.
- Compute-based risk and policy evaluation.

