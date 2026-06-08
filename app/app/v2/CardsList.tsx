"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Play, Flame, Database, AlertTriangle, CheckCircle2 } from "lucide-react";

type Card = {
  id: string;
  label: string;
  status: "active" | "expired" | "exhausted" | "revoked";
  delegate: string;
  spentUsd: number;
  expiresAt: string;
  auditRoots: string[];
  intent: {
    purpose: string;
    token: string;
    dailyCapUsd: number;
    perCallCapUsd: number;
    allowedTargets: string[];
    expiresInDays: number;
  };
};

type Execution = {
  id: string;
  summary: string;
  amountUsd: number;
  status: string;
  txHash?: string;
  auditRoot?: string;
  createdAt: string;
};

const STATUS_COLOR: Record<Card["status"], { bg: string; fg: string }> = {
  active: { bg: "rgba(67, 212, 131, 0.15)", fg: "#43D483" },
  revoked: { bg: "rgba(255, 90, 18, 0.15)", fg: "#FF8120" },
  expired: { bg: "rgba(255, 179, 49, 0.15)", fg: "#FFB331" },
  exhausted: { bg: "rgba(255, 179, 49, 0.15)", fg: "#FFB331" }
};

export function CardsList({ refreshKey }: { refreshKey: number }) {
  const [cards, setCards] = useState<Card[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await fetch("/api/v2/cards").then((r) => r.json());
      if (data.ok) setCards(data.cards);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  if (!cards.length) {
    return (
      <p className="text-sm" style={{ color: "rgba(255, 246, 232, 0.5)" }}>
        No cards yet — mint one above and it appears here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onChange={refresh} />
      ))}
    </div>
  );
}

function CardItem({ card, onChange }: { card: Card; onChange: () => void }) {
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const loadExecs = useCallback(async () => {
    try {
      const d = await fetch(`/api/v2/cards/${card.id}/executions`).then((r) => r.json());
      if (d.ok) setExecutions(d.executions);
    } catch {
      /* ignore */
    }
  }, [card.id]);

  useEffect(() => {
    loadExecs();
  }, [loadExecs]);

  async function run() {
    setBusy(true);
    setError(undefined);
    try {
      const d = await fetch(`/api/v2/cards/${card.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: card.intent.allowedTargets[0],
          seller,
          amountUsd: Number(amount),
          note: note || undefined
        })
      }).then((r) => r.json());
      if (!d.ok) {
        setError(d.error);
        return;
      }
      setAmount("");
      setNote("");
      await Promise.all([loadExecs(), onChange()]);
    } catch {
      setError("Run failed.");
    } finally {
      setBusy(false);
    }
  }

  async function burn() {
    await fetch(`/api/v2/cards/${card.id}/revoke`, { method: "POST" });
    onChange();
  }

  const pct = Math.min(100, (card.spentUsd / card.intent.dailyCapUsd) * 100);
  const remaining = Math.max(0, card.intent.dailyCapUsd - card.spentUsd);
  const status = STATUS_COLOR[card.status];
  const active = card.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl"
      style={{ background: "rgba(11, 7, 5, 0.5)", border: "1px solid rgba(255, 129, 32, 0.2)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold" style={{ color: "#FFF7E8" }}>
              {card.label}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: status.bg, color: status.fg }}
            >
              {card.status}
            </span>
          </div>
          <span className="text-xs" style={{ color: "rgba(255, 246, 232, 0.5)" }}>
            {card.intent.allowedTargets.join(", ")} · expires{" "}
            {new Date(card.expiresAt).toLocaleDateString()}
          </span>
        </div>
        {active && (
          <button
            onClick={burn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(255, 90, 18, 0.12)",
              border: "1px solid rgba(255, 129, 32, 0.3)",
              color: "#FF8120"
            }}
          >
            <Flame className="w-3.5 h-3.5" /> Burn Card
          </button>
        )}
      </div>

      {/* Live budget */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255, 246, 232, 0.5)" }}>
          <span>Daily budget</span>
          <span>
            ${card.spentUsd.toFixed(2)} of ${card.intent.dailyCapUsd.toFixed(2)}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255, 246, 232, 0.08)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #FFB331, #FF5A12)" }}
          />
        </div>
        <div className="text-xs mt-1.5" style={{ color: "rgba(255, 246, 232, 0.4)" }}>
          ${remaining.toFixed(2)} remaining today
        </div>
      </div>

      {/* Run agent */}
      {active && (
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <input
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="Seller address (0x…)"
            className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ background: "rgba(11, 7, 5, 0.6)", border: "1px solid rgba(255, 129, 32, 0.25)", color: "#FFF7E8" }}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$"
            className="w-20 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "rgba(11, 7, 5, 0.6)", border: "1px solid rgba(255, 129, 32, 0.25)", color: "#FFF7E8" }}
          />
          <button
            onClick={run}
            disabled={busy || !seller || !amount}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FFB331, #FF5A12)", color: "#050403" }}
          >
            <Play className="w-3.5 h-3.5" /> {busy ? "Running…" : "Run agent"}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mb-4 text-xs" style={{ color: "#FFB331" }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Activity */}
      {executions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold mb-1" style={{ color: "rgba(255, 246, 232, 0.6)" }}>
            Activity
          </div>
          {executions.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 p-2.5 rounded-lg text-xs"
              style={{ background: "rgba(11, 7, 5, 0.4)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#43D483" }} />
              <span style={{ color: "#FFF7E8" }}>{e.summary}</span>
              {e.auditRoot && (
                <span className="ml-auto flex items-center gap-1 font-mono" style={{ color: "rgba(255, 179, 49, 0.7)" }}>
                  <Database className="w-3 h-3" />
                  {e.auditRoot.slice(0, 8)}…
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
