"use client";

import { motion } from "motion/react";
import { ConnectWalletButton } from "./ConnectWalletButton";

export default function V2Page() {
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
        <p className="mb-10" style={{ color: "rgba(255, 246, 232, 0.6)" }}>
          Connect MetaMask (Flask 13.5+ on Sepolia) to upgrade your wallet into a
          smart account. This is the first step before minting an AgiCard.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="p-7 rounded-xl glass-panel-elevated"
      >
        <ConnectWalletButton />
      </motion.div>
    </div>
  );
}
