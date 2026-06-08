"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ConnectedWallet } from "@/lib/v2/wallet";
import type { ValidatedIntent } from "@/lib/v2/intent";
import { grantCard } from "@/lib/v2/grantCard";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function MintCardButton({
  wallet,
  intent,
  onMinted
}: {
  wallet: ConnectedWallet;
  intent: ValidatedIntent;
  onMinted?: () => void;
}) {
  const [status, setStatus] = useState<string>();
  const [cardId, setCardId] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function mint() {
    setBusy(true);
    setError(undefined);
    setCardId(undefined);
    try {
      // 1) Get the agent's delegate (session) address for a new card.
      setStatus("Preparing agent session…");
      const session = await fetch("/api/v2/cards/session", { method: "POST" }).then((r) =>
        r.json()
      );
      if (!session.ok) throw new Error(session.error);

      // 2) Ask MetaMask to grant the daily spend permission (ERC-7715).
      setStatus("Awaiting MetaMask approval…");
      const granted = await grantCard({
        walletClient: wallet.walletClient,
        intent,
        sessionAddress: session.sessionAddress
      });

      // 3) Store the minted card.
      setStatus("Saving card…");
      const saved = await fetch("/api/v2/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.cardId,
          intent,
          owner: wallet.address,
          delegate: session.sessionAddress,
          permissionsContext: granted.permissionsContext,
          delegationManager: granted.delegationManager,
          expiry: granted.expiry
        })
      }).then((r) => r.json());
      if (!saved.ok) throw new Error(saved.error || "Failed to save card.");

      setCardId(saved.card.id);
      setStatus(undefined);
      onMinted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minting failed.");
      setStatus(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <motion.button
        onClick={mint}
        disabled={busy}
        whileHover={{ scale: busy ? 1 : 1.02 }}
        whileTap={{ scale: busy ? 1 : 0.98 }}
        className="flex items-center gap-2 px-7 py-4 rounded-lg font-semibold disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)",
          color: "#050403",
          boxShadow: "0 8px 24px rgba(255, 90, 18, 0.4)"
        }}
      >
        <CreditCard className="w-5 h-5" />
        {busy ? status || "Minting…" : "Mint AgiCard"}
      </motion.button>

      {cardId && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg text-sm"
          style={{ background: "rgba(67, 212, 131, 0.12)", color: "#43D483" }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Card minted · {short(cardId)} — the agent can now spend within its limits.</span>
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
