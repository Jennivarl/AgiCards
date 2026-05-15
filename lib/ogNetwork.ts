export const ogGalileo = {
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G"
  },
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  explorerUrl: "https://chainscan-galileo.0g.ai",
  storageExplorerUrl: "https://storagescan-galileo.0g.ai"
};

export function contractExplorerLink(address?: string) {
  if (!address) {
    return ogGalileo.explorerUrl;
  }

  return `${ogGalileo.explorerUrl}/address/${address}`;
}

