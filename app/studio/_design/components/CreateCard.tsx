import { useState, type CSSProperties } from "react";
import {
  X,
  CheckCircle,
  Wallet,
  CreditCard,
  Zap,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useWallet } from "../WalletProvider";
import { grantCard } from "@/lib/v2/grantCard";
import {
  permissionIntentSchema,
  TARGET_KEYS,
  TARGET_LABELS,
  type ValidatedIntent,
  type TargetKey,
} from "@/lib/v2/intent";

const fieldStyle: CSSProperties = {
  width: "100%",
  background: "#F8F2E9",
  border: "1px solid #EFE6D8",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 14,
  color: "#1C1714",
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#7A6A59",
  marginBottom: 5,
};

interface CreateCardProps {
  initialDescription?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "connect" | "describe" | "mint" | "success";

const GOLD = "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)";

function ErrorNote({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(224,83,59,0.07)",
        border: "1px solid rgba(224,83,59,0.25)",
        color: "#E0533B",
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}

export function CreateCard({ initialDescription, onClose, onSuccess }: CreateCardProps) {
  const { wallet, address, smartAddress, status, connect, short } = useWallet();

  const [step, setStep] = useState<Step>(status === "connected" ? "describe" : "connect");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState(initialDescription ?? "");
  const [dailyCap, setDailyCap] = useState("");
  const [perCharge, setPerCharge] = useState("");
  const [days, setDays] = useState("");
  const [target, setTarget] = useState<TargetKey>("x402");
  const [formError, setFormError] = useState<string>();
  const [intent, setIntent] = useState<ValidatedIntent>();
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>();
  const [mintError, setMintError] = useState<string>();

  const steps: { id: Step; label: string }[] = [
    { id: "connect", label: "Connect" },
    { id: "describe", label: "Limits" },
    { id: "mint", label: "Mint" },
  ];
  const stepIndex = { connect: 0, describe: 1, mint: 2, success: 3 };

  // Validate the form fields into a permission intent. Every limit must be
  // filled correctly — nothing is defaulted. The zod schema is the final gate,
  // matching exactly what the server and chain accept.
  function submitForm() {
    const daily = Number(dailyCap);
    const per = Number(perCharge);
    const d = Number(days);

    if (!purpose.trim()) return setFormError("Tell us what this card pays for.");
    if (!dailyCap || !Number.isFinite(daily) || daily <= 0)
      return setFormError("Enter a daily limit greater than $0.");
    if (daily > 10_000) return setFormError("Daily limit can't exceed $10,000.");
    if (!perCharge || !Number.isFinite(per) || per <= 0)
      return setFormError("Enter a per-charge limit greater than $0.");
    if (per > daily) return setFormError("Per-charge can't be more than the daily limit.");
    if (!days || !Number.isInteger(d) || d < 1 || d > 30)
      return setFormError("Duration must be a whole number of days between 1 and 30.");

    const result = permissionIntentSchema.safeParse({
      purpose: purpose.trim(),
      token: "USDC",
      dailyCapUsd: daily,
      perCallCapUsd: per,
      allowedTargets: [target],
      expiresInDays: d,
    });
    if (!result.success) {
      return setFormError(result.error.issues[0]?.message ?? "Please check the limits.");
    }
    setFormError(undefined);
    setIntent(result.data);
    setStep("mint");
  }

  // The real mint: agent session -> user signs the delegation in MetaMask -> save.
  async function mint() {
    if (!wallet || !intent || !address) return;
    setMinting(true);
    setMintError(undefined);
    try {
      setMintStatus("Preparing agent session…");
      const session = await fetch("/api/v2/cards/session", { method: "POST" }).then((r) =>
        r.json()
      );
      if (!session.ok) throw new Error(session.error || "Could not start a session.");

      setMintStatus("Awaiting MetaMask signature…");
      const granted = await grantCard({
        walletClient: wallet.walletClient,
        intent,
        sessionAddress: session.sessionAddress,
      });

      setMintStatus("Saving card…");
      const saved = await fetch("/api/v2/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.cardId,
          name: name.trim() || undefined,
          intent,
          owner: address,
          delegate: session.sessionAddress,
          permissionsContext: granted.permissionsContext,
          delegationManager: granted.delegationManager,
          expiry: granted.expiry,
        }),
      }).then((r) => r.json());
      if (!saved.ok) throw new Error(saved.error || "Failed to save card.");

      setMintStatus(undefined);
      setStep("success");
    } catch (e) {
      setMintError(e instanceof Error ? e.message : "Minting failed.");
      setMintStatus(undefined);
    } finally {
      setMinting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,23,20,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FDF8F0",
          borderRadius: 20,
          border: "1px solid #EFE6D8",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(28,23,20,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ color: "#1C1714" }}>
            {step === "success" ? "Card minted!" : "Create a Card"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A6A59",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        {step !== "success" && (
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {steps.map((s, i) => {
                const current = stepIndex[step];
                const isDone = i < current;
                const isActive = s.id === step;
                return (
                  <div
                    key={s.id}
                    style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isDone
                            ? "#1FA864"
                            : isActive
                            ? "linear-gradient(135deg, #FFB331, #FF5A12)"
                            : "#F8F2E9",
                          border: isDone || isActive ? "none" : "1.5px solid #EFE6D8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isDone ? "white" : isActive ? "#1C1714" : "#7A6A59",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {isDone ? <CheckCircle size={14} /> : i + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: isActive ? "#FF5A12" : isDone ? "#1FA864" : "#7A6A59",
                          fontWeight: isActive ? 700 : 400,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: isDone ? "#1FA864" : "#EFE6D8",
                          margin: "0 8px",
                          marginBottom: 18,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step content */}
        <div style={{ padding: 24 }}>
          {/* Step 1: Connect */}
          {step === "connect" && (
            <div>
              {status !== "connected" ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FFE45D20, #FF5A1220)",
                      border: "1px solid #EFE6D8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <Wallet size={28} color="#FFB331" />
                  </div>
                  <h4 style={{ color: "#1C1714", marginBottom: 8 }}>Connect MetaMask</h4>
                  <p style={{ color: "#7A6A59", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                    Connect your MetaMask wallet on Base to create an AgiCard. We use your Smart
                    Account (EIP-7702) to enforce on-chain spend limits.
                  </p>
                  <button
                    onClick={connect}
                    disabled={status === "connecting"}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: status === "connecting" ? "#EFE6D8" : GOLD,
                      color: status === "connecting" ? "#7A6A59" : "#1C1714",
                      cursor: status === "connecting" ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {status === "connecting" ? "Connecting…" : "Connect MetaMask"}
                  </button>
                  {status === "error" && <ErrorNote text="Could not connect. Make sure MetaMask is installed and on Base." />}
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "rgba(31,168,100,0.08)",
                      border: "1px solid rgba(31,168,100,0.2)",
                      borderRadius: 10,
                    }}
                  >
                    <CheckCircle size={16} color="#1FA864" />
                    <span style={{ fontSize: 13, color: "#1FA864", fontWeight: 600 }}>
                      MetaMask connected
                    </span>
                  </div>
                  {[
                    { label: "Wallet", value: short(address), badge: "owner" },
                    { label: "Smart Account", value: short(smartAddress), badge: "7702" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "white",
                        border: "1px solid #EFE6D8",
                        borderRadius: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: "#7A6A59", marginBottom: 2 }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: "#1C1714" }}>
                          {row.value}
                        </div>
                      </div>
                      <span
                        style={{
                          background: "rgba(255,179,49,0.15)",
                          color: "#FFB331",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {row.badge}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => setStep("describe")}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: GOLD,
                      color: "#1C1714",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set the limits (form) */}
          {step === "describe" && (
            <div>
              <h4 style={{ color: "#1C1714", marginBottom: 4 }}>Set the card&apos;s limits</h4>
              <p style={{ color: "#7A6A59", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                Fill in each limit. They are enforced on-chain, so the agent can never go past them.
              </p>

              <label style={labelStyle}>
                Agent name <span style={{ color: "#A89A88", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Research Agent"
                style={{ ...fieldStyle, marginBottom: 14 }}
              />

              <label style={labelStyle}>What it pays for</label>
              <input
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setFormError(undefined);
                }}
                maxLength={100}
                placeholder="e.g. AI tools, cloud compute, data feeds"
                style={{ ...fieldStyle, marginBottom: 14 }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Daily limit (USD)</label>
                  <input
                    value={dailyCap}
                    onChange={(e) => {
                      setDailyCap(e.target.value);
                      setFormError(undefined);
                    }}
                    inputMode="decimal"
                    placeholder="1.00"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Per charge (USD)</label>
                  <input
                    value={perCharge}
                    onChange={(e) => {
                      setPerCharge(e.target.value);
                      setFormError(undefined);
                    }}
                    inputMode="decimal"
                    placeholder="0.20"
                    style={fieldStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Duration (days)</label>
                  <input
                    value={days}
                    onChange={(e) => {
                      setDays(e.target.value);
                      setFormError(undefined);
                    }}
                    inputMode="numeric"
                    placeholder="7"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Spend on</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as TargetKey)}
                    style={{ ...fieldStyle, cursor: "pointer" }}
                  >
                    {TARGET_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {TARGET_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && <div style={{ marginBottom: 12 }}><ErrorNote text={formError} /></div>}
              <button
                onClick={submitForm}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: GOLD,
                  color: "#1C1714",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Continue to mint
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Mint */}
          {step === "mint" && intent && (
            <div>
              <h4 style={{ color: "#1C1714", marginBottom: 4 }}>Review & Mint</h4>
              <p style={{ color: "#7A6A59", fontSize: 13, marginBottom: 16 }}>
                One MetaMask signature to mint your card on-chain.
              </p>

              {/* Limits review */}
              <div
                style={{
                  background: "white",
                  border: "1px solid #EFE6D8",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: "Daily cap", value: `$${intent.dailyCapUsd.toFixed(2)}` },
                  { label: "Spend on", value: intent.allowedTargets.join(", ") },
                  { label: "Expires", value: `${intent.expiresInDays} days` },
                  { label: "Network", value: "Base" },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 0",
                      borderBottom: "1px solid #EFE6D8",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#7A6A59" }}>{row.label}</span>
                    <span style={{ color: "#1C1714", fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* MetaMask illustration */}
              <div
                style={{
                  background: "rgba(255,179,49,0.06)",
                  border: "1px dashed rgba(255,179,49,0.4)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: GOLD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                  }}
                >
                  <Zap size={22} color="#1C1714" />
                </div>
                <div style={{ fontSize: 13, color: "#1C1714", fontWeight: 600, marginBottom: 4 }}>
                  MetaMask will prompt you
                </div>
                <div style={{ fontSize: 11, color: "#7A6A59" }}>
                  Review and sign the delegation in MetaMask to mint your AgiCard on-chain.
                </div>
              </div>

              <button
                onClick={mint}
                disabled={minting}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: minting ? "#EFE6D8" : GOLD,
                  color: minting ? "#7A6A59" : "#1C1714",
                  cursor: minting ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {minting ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid #7A6A59",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    {mintStatus || "Minting…"}
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Mint AgiCard
                  </>
                )}
              </button>
              {mintError && <ErrorNote text={mintError} />}
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(31,168,100,0.12)",
                  border: "2px solid rgba(31,168,100,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle size={36} color="#1FA864" />
              </div>
              <h3 style={{ color: "#1C1714", marginBottom: 8 }}>Card minted!</h3>
              <p style={{ color: "#7A6A59", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your agent can now spend within its limits in USDC.
                <br />
                Revoke anytime from the dashboard.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onSuccess}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 10,
                    border: "none",
                    background: GOLD,
                    color: "#1C1714",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  View Cards →
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 10,
                    border: "1px solid #EFE6D8",
                    background: "white",
                    color: "#1C1714",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
