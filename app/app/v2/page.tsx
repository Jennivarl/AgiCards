"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { CreateCardPrompt } from "./CreateCardPrompt";
import { MintCardButton } from "./MintCardButton";
import type { ConnectedWallet } from "@/lib/v2/wallet";
import type { ValidatedIntent } from "@/lib/v2/intent";

function Panel({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-7 rounded-xl glass-panel-elevated mt-6"
    >
      {children}
    </motion.div>
  );
}

export default function V2Page() {
  const [wallet, setWallet] = useState<ConnectedWallet>();
  const [intent, setIntent] = useState<ValidatedIntent>();

  return (
    <div className="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#FFF7E8" }}>
          AgiCards v2
        </h1>
        <p className="mb-4" style={{ color: "rgba(255, 246, 232, 0.6)" }}>
          Connect MetaMask (Flask 13.5+ on Sepolia), describe a card in plain
          English, then mint it. The agent can spend only inside the limits you set.
        </p>
      </motion.div>

      <Panel>
        <h2 className="text-xl font-semibold mb-6" style={{ color: "#FFF7E8" }}>
          1 · Connect
        </h2>
        <ConnectWalletButton onConnected={setWallet} />
      </Panel>

      <Panel delay={0.1}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: "#FFF7E8" }}>
          2 · Describe the card
        </h2>
        <CreateCardPrompt onIntent={setIntent} />
      </Panel>

      <Panel delay={0.2}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: "#FFF7E8" }}>
          3 · Mint
        </h2>
        {wallet && intent ? (
          <MintCardButton wallet={wallet} intent={intent} />
        ) : (
          <p className="text-sm" style={{ color: "rgba(255, 246, 232, 0.5)" }}>
            Connect your wallet and preview a card above to enable minting.
          </p>
        )}
      </Panel>
    </div>
  );
}
