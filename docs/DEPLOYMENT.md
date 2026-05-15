# 0G Deployment

This project deploys `contracts/AgiCardsRegistry.sol` to 0G Mainnet (Chain ID 16661).

## Environment

Create `.env.local` with:

```txt
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_EXPLORER_URL=https://chainscan.0g.ai
DEPLOYER_PRIVATE_KEY=your_wallet_private_key
OG_STORAGE_INDEXER_RPC=https://indexer-storage-turbo.0g.ai
OG_STORAGE_PRIVATE_KEY=your_wallet_private_key
OG_COMPUTE_BASE_URL=https://router-api.0g.ai/v1
OG_COMPUTE_API_KEY=your_0g_router_api_key
OG_COMPUTE_MODEL=OGM-1.0-35B-A3B
OG_COMPUTE_FALLBACK_MODEL=deepseek-v4-pro
```

Do not commit `.env.local`.

The integration status endpoint reports missing live-mode variables:

```txt
/api/integrations/status
```

## Compile

```bash
npm run compile:contract
```

This writes:

```txt
artifacts/AgiCardsRegistry.json
```

## Deploy

```bash
npm run deploy:0g
```

The script prints:

- deployment transaction hash
- 0G Explorer transaction link
- contract address
- 0G Explorer contract link

Add the printed contract address to `.env.local`:

```txt
AGICARDS_REGISTRY_ADDRESS=0x...
```

Current mainnet deployment:

```txt
AGICARDS_REGISTRY_ADDRESS=0xc757698204543af249e328764e89530464de668e
Explorer=https://chainscan.0g.ai/address/0xc757698204543af249e328764e89530464de668e
DeploymentTx=https://chainscan.0g.ai/tx/0xb9e73926ec6a01df223b84a98a718022955838d09f7257da05cc76fb00fdc8b9
```

## Hackathon Proof

After deployment, run demo actions that emit:

- `AgentRegistered`
- `WalletFunded`
- `PolicyCreated`
- `CardRequestCreated`
- `CardRequestApproved`
- `Web3SpendLogged`
- `ReceiptStored`

Submit the 0G contract address and explorer link through HackQuest.
