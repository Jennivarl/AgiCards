export const AGICARDS_REGISTRY_ABI = [
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

