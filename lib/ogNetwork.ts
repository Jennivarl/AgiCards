export const ogMainnet = {
  id: 16661,
  name: "0G Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G"
  },
  rpcUrl: "https://evmrpc.0g.ai",
  explorerUrl: "https://chainscan.0g.ai",
  storageExplorerUrl: "https://storagescan.0g.ai"
};

export function contractExplorerLink(address?: string) {
  if (!address) {
    return ogMainnet.explorerUrl;
  }

  return `${ogMainnet.explorerUrl}/address/${address}`;
}

export function transactionExplorerLink(hash?: string) {
  if (!hash) {
    return ogMainnet.explorerUrl;
  }

  return `${ogMainnet.explorerUrl}/tx/${hash}`;
}
