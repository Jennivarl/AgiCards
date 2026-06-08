"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { connectMetaMask, type ConnectedWallet } from "@/lib/v2/wallet";
import { toUserSmartAccount } from "@/lib/v2/smartAccount";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton({
  onConnected
}: {
  onConnected?: (wallet: ConnectedWallet) => void;
}) {
  const [eoa, setEoa] = useState<string>();
  const [smartAccount, setSmartAccount] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    setError(undefined);
    try {
      const wallet = await connectMetaMask();
      setEoa(wallet.address);
      // Wrap the connected EOA as a MetaMask Stateless-7702 smart account.
      const account = await toUserSmartAccount(wallet.walletClient, wallet.address);
      setSmartAccount(account.address);
      onConnected?.(wallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <motion.button
        onClick={connect}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="flex items-center gap-2 px-7 py-4 rounded-lg font-semibold disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)",
          color: "#050403",
          boxShadow: "0 8px 24px rgba(255, 90, 18, 0.4)"
        }}
      >
        <Wallet className="w-5 h-5" />
        {loading ? "Connecting…" : eoa ? "Reconnect Wallet" : "Connect Wallet"}
      </motion.button>

      {eoa && (
        <div className="p-4 rounded-lg space-y-2" style={{ background: "rgba(11, 7, 5, 0.5)" }}>
          <Row label="Wallet (EOA)" value={short(eoa)} />
          {smartAccount && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: "#43D483" }} />
              <Row label="Smart Account (7702)" value={short(smartAccount)} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-2 p-4 rounded-lg text-sm"
          style={{ background: "rgba(255, 90, 18, 0.12)", color: "#FFB331" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-sm font-medium" style={{ color: "rgba(255, 246, 232, 0.7)" }}>
        {label}
      </span>
      <span className="text-sm font-mono" style={{ color: "#FFB331" }}>
        {value}
      </span>
    </div>
  );
}
