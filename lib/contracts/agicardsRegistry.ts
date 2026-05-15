export const AGICARDS_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "metadataRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "depositFunds",
    stateMutability: "payable",
    inputs: [{ name: "receiptRoot", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "bytes32" },
      { name: "agentId", type: "bytes32" },
      { name: "policyRoot", type: "bytes32" },
      { name: "maxPerRequest", type: "uint256" },
      { name: "dailyLimit", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "requestCard",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "agentId", type: "bytes32" },
      { name: "policyId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "requestRoot", type: "bytes32" },
      { name: "stripeMode", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveCardRequest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "decisionRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "rejectCardRequest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "decisionRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "linkStripeCard",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "stripeCardHash", type: "bytes32" },
      { name: "cardMetadataRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "createWeb3Card",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "web3CardId", type: "bytes32" },
      { name: "cardMetadataRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "logWeb3Spend",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "receiptRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "logStripeAuthorization",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "receiptRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateAgentMemory",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "memoryRoot", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "metadataRoot", type: "bytes32", indexed: false }
    ]
  },
  {
    type: "event",
    name: "WalletFunded",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "receiptRoot", type: "bytes32", indexed: false }
    ]
  },
  {
    type: "event",
    name: "CardRequestApproved",
    inputs: [
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "decisionRoot", type: "bytes32", indexed: false }
    ]
  },
  {
    type: "event",
    name: "ReceiptStored",
    inputs: [
      { name: "entityId", type: "bytes32", indexed: true },
      { name: "receiptRoot", type: "bytes32", indexed: false }
    ]
  }
] as const;

export const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
