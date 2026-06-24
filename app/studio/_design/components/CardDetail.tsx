import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Flame,
  Play,
  ExternalLink,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Activity,
  Bot,
  Repeat,
  Pause,
} from "lucide-react";
import { useCards } from "../useCards";
import { useWallet } from "../WalletProvider";
import { cardGradient } from "../cardColors";
import { EXPLORER_URL } from "@/lib/v2/chains";
import { buildAuthMessage, type OwnerAuth } from "@/lib/v2/auth";
import type { Hex } from "viem";
import type { AgentExecution } from "@/lib/v2/types";
import type { TargetKey } from "@/lib/v2/intent";

interface CardDetailProps {
  cardId: string;
  onBack: () => void;
}

const GOLD = "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)";

function short(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86_400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function CardDetail({ cardId, onBack }: CardDetailProps) {
  const { cards, loading, refresh } = useCards();
  const { wallet, address } = useWallet();
  const card = cards.find((c) => c.id === cardId);
  // Cached owner-authorization signature (sign once per card, reused for the
  // auto-pay loop) so the server can prove the caller owns this card.
  const authRef = useRef<{ cardId: string; message: string; signature: Hex; expires: number } | undefined>(undefined);

  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [recipient, setRecipient] = useState("");
  const [runAmount, setRunAmount] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string>();
  const [revoking, setRevoking] = useState(false);
  const [auto, setAuto] = useState(false);
  const [intervalSec, setIntervalSec] = useState(30);
  const [autoCount, setAutoCount] = useState(0);

  const loadExecutions = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/cards/${cardId}/executions`);
      const data = await res.json();
      if (data.ok) setExecutions(data.executions as AgentExecution[]);
    } catch {
      /* leave empty */
    }
  }, [cardId]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  // Owner authorization: sign a short capability once per card (reused for the
  // whole hour and the auto-pay loop), so the server can prove the caller owns
  // the card before moving any money.
  const ensureAuth = async (cId: string, owner: string): Promise<OwnerAuth> => {
    const now = Date.now();
    const cur = authRef.current;
    if (cur && cur.cardId === cId && cur.expires - 60_000 > now) {
      return { message: cur.message, signature: cur.signature };
    }
    if (!wallet || !address) throw new Error("Connect your wallet to authorize this card.");
    const expires = now + 60 * 60 * 1000;
    const message = buildAuthMessage(cId, owner, expires);
    const signature = (await wallet.walletClient.signMessage({ account: address, message })) as Hex;
    authRef.current = { cardId: cId, message, signature, expires };
    return { message, signature };
  };

  // One charge through the card's delegation. Returns true on success so the
  // subscription loop can stop itself when the on-chain cap finally rejects it.
  // NOTE: all hooks below MUST stay above the `if (!card)` early return.
  const charge = async (): Promise<boolean> => {
    if (!card || !recipient.trim() || !runAmount.trim()) return false;
    const callSkill = (card.intent.allowedTargets[0] ?? "x402") as TargetKey;
    setRunning(true);
    setRunError(undefined);
    try {
      const auth = await ensureAuth(card.id, card.owner);
      const res = await fetch(`/api/v2/cards/${card.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: callSkill, target: recipient.trim(), amountUsd: Number(runAmount), auth }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Run failed.");
      await Promise.all([refresh(), loadExecutions()]);
      return true;
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Run failed.");
      return false;
    } finally {
      setRunning(false);
    }
  };

  async function runAgent() {
    const ok = await charge();
    if (ok) {
      setRecipient("");
      setRunAmount("");
    }
  }

  // Subscription: start it once and the agent pays on its own every interval,
  // with no more clicks — until the on-chain daily cap rejects a charge (then it
  // stops itself) or you press Stop.
  const chargeRef = useRef(charge);
  chargeRef.current = charge;
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    const tick = async () => {
      const ok = await chargeRef.current();
      if (cancelled) return;
      if (ok) setAutoCount((n) => n + 1);
      else setAuto(false);
    };
    tick();
    const id = setInterval(tick, intervalSec * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [auto, intervalSec]);

  // Loading / not-found.
  if (!card) {
    return (
      <div style={{ background: "#FDF8F0", minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={onBack}
            style={{ background: "white", border: "1px solid #EFE6D8", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#7A6A59", display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ marginTop: 40, textAlign: "center", color: "#9A8A79", fontSize: 14 }}>
            {loading ? "Loading card…" : "Card not found."}
          </div>
        </div>
      </div>
    );
  }

  const dailyLimit = card.intent.dailyCapUsd;
  const spent = card.spentUsd;
  const pct = dailyLimit > 0 ? Math.round((spent / dailyLimit) * 100) : 0;
  const targets = card.intent.allowedTargets.join(", ");
  const skill = (card.intent.allowedTargets[0] ?? "x402") as TargetKey;

  const expMs = new Date(card.expiresAt).getTime();
  const daysLeft = Math.ceil((expMs - Date.now()) / 86_400_000);
  const expiryLabel = daysLeft > 0 ? `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "Expired";

  const statusColor =
    card.status === "active" ? "#1FA864" : card.status === "revoked" ? "#FF5A12" : "#F59E0B";
  const statusBg =
    card.status === "active"
      ? "rgba(31,168,100,0.12)"
      : card.status === "revoked"
      ? "rgba(255,90,18,0.12)"
      : "rgba(245,158,11,0.12)";

  const isActive = card.status === "active";

  async function revoke() {
    if (!card) return;
    setRevoking(true);
    setRunError(undefined);
    try {
      const auth = await ensureAuth(card.id, card.owner);
      const res = await fetch(`/api/v2/cards/${card.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth }),
      });
      const data = await res.json();
      if (data.ok) await refresh();
      else setRunError(data.error || "Revoke failed.");
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Revoke failed.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div style={{ background: "#FDF8F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={onBack}
              style={{
                background: "white",
                border: "1px solid #EFE6D8",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#7A6A59",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ color: "#1C1714" }}>{card.intent.purpose}</h2>
            <span
              style={{
                background: statusBg,
                color: statusColor,
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {card.status.toUpperCase()}
            </span>
          </div>
          <button
            onClick={revoke}
            disabled={!isActive || revoking}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(224,83,59,0.3)",
              background: "rgba(224,83,59,0.06)",
              color: "#E0533B",
              cursor: !isActive || revoking ? "not-allowed" : "pointer",
              opacity: !isActive ? 0.5 : 1,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Flame size={14} /> {revoking ? "Revoking…" : "Revoke"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginBottom: 20,
          }}
        >
          {/* Hero card visual */}
          <div
            style={{
              background: cardGradient(card.id),
              borderRadius: 20,
              padding: 28,
              color: "#1C1714",
              boxShadow: "0 8px 32px rgba(255,179,49,0.3)",
              position: "relative",
              overflow: "hidden",
              minHeight: 180,
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{card.intent.purpose}</div>
              <div style={{ fontSize: 12, opacity: 0.7, fontFamily: "monospace" }}>
                {targets} · {short(card.delegate)}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>${dailyLimit}/day</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              ${card.intent.perCallCapUsd} per charge · expires {expiryLabel}
            </div>
          </div>

          {/* Budget ring + Run Agent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Ring */}
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid #EFE6D8",
                padding: 20,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F8F2E9" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="#FFB331"
                    strokeWidth="8"
                    strokeDasharray={`${(Math.min(pct, 100) / 100) * 201} 201`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1714" }}>{pct}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1C1714" }}>${spent.toFixed(2)}</div>
                <div style={{ fontSize: 13, color: "#7A6A59" }}>of ${dailyLimit} today</div>
                <div style={{ fontSize: 11, color: "#7A6A59", marginTop: 4 }}>
                  ${Math.max(dailyLimit - spent, 0).toFixed(2)} remaining
                </div>
              </div>
            </div>

            {/* Run Agent */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFE6D8", padding: 16 }}>
              <h4 style={{ color: "#1C1714", marginBottom: 10 }}>Run Agent</h4>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={skill === "uniswap-v3" ? "Token to buy (0x…)" : "Pay to (0x…)"}
                disabled={!isActive || auto}
                style={{
                  width: "100%",
                  background: "#F8F2E9",
                  border: "1px solid #EFE6D8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#1C1714",
                  outline: "none",
                  marginBottom: 8,
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              <input
                value={runAmount}
                onChange={(e) => setRunAmount(e.target.value)}
                placeholder="Amount in USD e.g. 5.00"
                disabled={!isActive || auto}
                style={{
                  width: "100%",
                  background: "#F8F2E9",
                  border: "1px solid #EFE6D8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#1C1714",
                  outline: "none",
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={runAgent}
                disabled={!isActive || running || !recipient.trim() || !runAmount.trim()}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: !isActive || running || !recipient.trim() || !runAmount.trim() ? "#EFE6D8" : GOLD,
                  color: !isActive || running || !recipient.trim() || !runAmount.trim() ? "#7A6A59" : "#1C1714",
                  cursor: !isActive || running ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Play size={14} fill="#1C1714" /> {running ? "Running…" : isActive ? "Run Agent" : "Card revoked"}
              </button>
              {runError && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "#E0533B", lineHeight: 1.5 }}>{runError}</div>
              )}

              {/* Subscription: start once, the agent keeps paying on its own. */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #EFE6D8" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1714" }}>Auto-pay (subscription)</span>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    disabled={auto || !isActive}
                    style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #EFE6D8", background: "#F8F2E9", color: "#1C1714" }}
                  >
                    <option value={15}>every 15s</option>
                    <option value={30}>every 30s</option>
                    <option value={60}>every 1 min</option>
                    <option value={300}>every 5 min</option>
                  </select>
                </div>
                <button
                  onClick={() => { setRunError(undefined); if (!auto) setAutoCount(0); setAuto((a) => !a); }}
                  disabled={!isActive || (!auto && (!recipient.trim() || !runAmount.trim()))}
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: auto ? "rgba(224,83,59,0.3)" : "#EFE6D8",
                    background: auto ? "rgba(224,83,59,0.06)" : "#F8F2E9",
                    color: auto ? "#E0533B" : !isActive || !recipient.trim() || !runAmount.trim() ? "#9A8A79" : "#1C1714",
                    cursor: !isActive || (!auto && (!recipient.trim() || !runAmount.trim())) ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 12.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {auto ? <><Pause size={13} /> Stop subscription</> : <><Repeat size={13} /> Start subscription</>}
                </button>
                {auto && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#1FA864", textAlign: "center" }}>
                    Paying every {intervalSec < 60 ? `${intervalSec}s` : `${intervalSec / 60} min`} · {autoCount} charge{autoCount === 1 ? "" : "s"} so far
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Agent */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid #EFE6D8",
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot size={22} color="#1C1714" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: "#7A6A59", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Agent</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1714", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.label}</div>
            <a
              href={`${EXPLORER_URL}/address/${card.delegate}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, fontFamily: "monospace", color: "#7A6A59", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}
            >
              {short(card.delegate)} <ExternalLink size={10} />
            </a>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1C1714" }}>${dailyLimit}/day</div>
            <div style={{ fontSize: 12, color: "#7A6A59" }}>${card.intent.perCallCapUsd} per charge</div>
          </div>
        </div>

        {/* Permission details */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid #EFE6D8",
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Shield size={16} color="#FFB331" />
            <h4 style={{ color: "#1C1714" }}>Permission Details</h4>
          </div>
          {[
            { label: "Delegate", value: card.delegate, mono: true },
            { label: "Targets", value: targets, mono: false },
            { label: "Daily cap", value: `$${dailyLimit}`, mono: false },
            { label: "Expiry", value: expiryLabel, mono: false },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #EFE6D8",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 13, color: "#7A6A59", flexShrink: 0 }}>{row.label}</span>
              <span
                style={{
                  fontSize: 12,
                  color: "#1C1714",
                  fontWeight: 600,
                  fontFamily: row.mono ? "monospace" : "inherit",
                  wordBreak: "break-all",
                  textAlign: "right",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Activity timeline */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid #EFE6D8",
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Activity size={16} color="#FFB331" />
            <h4 style={{ color: "#1C1714" }}>Activity Timeline</h4>
          </div>
          {executions.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9A8A79", padding: "8px 0" }}>
              No activity yet. Run the agent to make a payment.
            </div>
          ) : (
            executions.map((tx, i) => {
              const ok = tx.status === "confirmed";
              const failed = tx.status === "reverted";
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    paddingBottom: i < executions.length - 1 ? 16 : 0,
                    marginBottom: i < executions.length - 1 ? 16 : 0,
                    borderBottom: i < executions.length - 1 ? "1px solid #EFE6D8" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: failed ? "rgba(224,83,59,0.12)" : "rgba(31,168,100,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {failed ? <XCircle size={14} color="#E0533B" /> : <CheckCircle size={14} color="#1FA864" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#1C1714", marginBottom: 4 }}>{tx.summary}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {tx.txHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "#F8F2E9",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: 10,
                            fontFamily: "monospace",
                            color: "#7A6A59",
                            textDecoration: "none",
                          }}
                        >
                          {short(tx.txHash)}
                          <ExternalLink size={9} />
                        </a>
                      )}
                      {!ok && !failed && (
                        <span style={{ fontSize: 10, color: "#B0892F", fontWeight: 600 }}>{tx.status}</span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#7A6A59" }}>
                        <Clock size={9} /> {timeAgo(tx.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
