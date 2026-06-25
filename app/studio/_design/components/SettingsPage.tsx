import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wallet,
  Globe,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";
import { useWallet } from "../WalletProvider";
import { useCards } from "../useCards";

interface SettingsPageProps {
  onBack: () => void;
}

type Section = "wallet" | "network" | "defaults" | "danger";

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { address, smartAddress, short, disconnect } = useWallet();
  const { cards, refresh } = useCards();
  const [revoking, setRevoking] = useState(false);
  const revokeAll = async () => {
    const active = cards.filter((c) => c.status === "active");
    if (active.length === 0) return;
    setRevoking(true);
    try {
      await Promise.all(active.map((c) => fetch(`/api/v2/cards/${c.id}/revoke`, { method: "POST" })));
      await refresh();
    } finally {
      setRevoking(false);
    }
  };
  const [activeSection, setActiveSection] = useState<Section>("wallet");
  const [network, setNetwork] = useState("base");
  const [customRpc, setCustomRpc] = useState("");
  const [dailyCap, setDailyCap] = useState("20");
  const [expiry, setExpiry] = useState("7");
  const [target, setTarget] = useState("x402");
  const [saved, setSaved] = useState(false);

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "wallet", label: "Wallet", icon: <Wallet size={16} /> },
    { id: "network", label: "Network", icon: <Globe size={16} /> },
    { id: "defaults", label: "Card Defaults", icon: <CreditCard size={16} /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
  ];

  // Load saved settings on mount so they survive reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("agicards:settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.customRpc != null) setCustomRpc(s.customRpc);
        if (s.dailyCap != null) setDailyCap(s.dailyCap);
        if (s.expiry != null) setExpiry(s.expiry);
        if (s.target != null) setTarget(s.target);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      "agicards:settings",
      JSON.stringify({ customRpc, dailyCap, expiry, target })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ background: "var(--st-fdf8f0)", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              background: "var(--st-surface)",
              border: "1px solid var(--st-efe6d8)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "var(--st-7a6a59)",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ color: "var(--st-1c1714)" }}>Settings</h2>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Section nav (desktop left, mobile top tabs) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: 180,
              flexShrink: 0,
            }}
            className="hidden md:flex"
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    activeSection === s.id
                      ? "linear-gradient(135deg, #FFE45D15, #FF5A1215)"
                      : "transparent",
                  borderLeft:
                    activeSection === s.id ? "2px solid #FFB331" : "2px solid transparent",
                  color: activeSection === s.id ? "#FF5A12" : "var(--st-7a6a59)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: activeSection === s.id ? 600 : 400,
                  textAlign: "left",
                }}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile tabs */}
          <div
            className="flex md:hidden"
            style={{
              width: "100%",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--st-efe6d8)",
                  background: activeSection === s.id
                    ? "linear-gradient(135deg, #FFB331, #FF5A12)"
                    : "var(--st-surface)",
                  color: activeSection === s.id ? "var(--st-1c1714)" : "var(--st-7a6a59)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                background: "var(--st-surface)",
                borderRadius: 14,
                border: "1px solid var(--st-efe6d8)",
                padding: 24,
                boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
              }}
            >
              {/* Wallet */}
              {activeSection === "wallet" && (
                <div>
                  <h3 style={{ color: "var(--st-1c1714)", marginBottom: 16 }}>Wallet</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #FFB331, #FF5A12)",
                        flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <User size={22} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--st-1c1714)", fontWeight: 600 }}>
                        {short(address) || "Not connected"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--st-7a6a59)" }}>MetaMask</div>
                    </div>
                  </div>
                  {[
                    { label: "Provider", value: "MetaMask" },
                    { label: "Account type", value: "Smart Account (7702)" },
                    { label: "Network", value: "Base" },
                    { label: "Smart Account", value: short(smartAddress) || "—" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: "1px solid var(--st-efe6d8)",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "var(--st-7a6a59)" }}>{row.label}</span>
                      <span style={{ color: "var(--st-1c1714)", fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { disconnect(); onBack(); }}
                    style={{
                      marginTop: 16,
                      padding: "9px 20px",
                      borderRadius: 8,
                      border: "1px solid rgba(224,83,59,0.3)",
                      background: "rgba(224,83,59,0.06)",
                      color: "#E0533B",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}

              {/* Network */}
              {activeSection === "network" && (
                <div>
                  <h3 style={{ color: "var(--st-1c1714)", marginBottom: 16 }}>Network</h3>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: "var(--st-7a6a59)", fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                      CHAIN
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["base"].map((chain) => (
                        <button
                          key={chain}
                          onClick={() => setNetwork(chain)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid var(--st-efe6d8)",
                            background: network === chain
                              ? "linear-gradient(135deg, #FFB331, #FF5A12)"
                              : "var(--st-surface)",
                            color: network === chain ? "var(--st-1c1714)" : "var(--st-7a6a59)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {chain}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--st-7a6a59)", fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                      CUSTOM RPC (OPTIONAL)
                    </label>
                    <input
                      value={customRpc}
                      onChange={(e) => setCustomRpc(e.target.value)}
                      placeholder="https://your-rpc.example.com"
                      style={{
                        width: "100%",
                        background: "var(--st-f8f2e9)",
                        border: "1px solid var(--st-efe6d8)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "var(--st-1c1714)",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    style={{
                      marginTop: 16,
                      padding: "9px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: saved ? "rgba(31,168,100,0.15)" : "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                      color: saved ? "#1FA864" : "var(--st-1c1714)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.2s",
                    }}
                  >
                    {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Network"}
                  </button>
                </div>
              )}

              {/* Card Defaults */}
              {activeSection === "defaults" && (
                <div>
                  <h3 style={{ color: "var(--st-1c1714)", marginBottom: 8 }}>Card Defaults</h3>
                  <p style={{ color: "var(--st-7a6a59)", fontSize: 13, marginBottom: 20 }}>
                    Default values when creating a new card.
                  </p>
                  {[
                    { label: "DEFAULT DAILY CAP ($)", value: dailyCap, onChange: setDailyCap, placeholder: "20" },
                    { label: "DEFAULT EXPIRY (DAYS)", value: expiry, onChange: setExpiry, placeholder: "7" },
                    { label: "DEFAULT TARGET PROTOCOL", value: target, onChange: setTarget, placeholder: "x402" },
                  ].map((field) => (
                    <div key={field.label} style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, color: "var(--st-7a6a59)", fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        style={{
                          width: "100%",
                          background: "var(--st-f8f2e9)",
                          border: "1px solid var(--st-efe6d8)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--st-1c1714)",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSave}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: saved ? "rgba(31,168,100,0.15)" : "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                      color: saved ? "#1FA864" : "var(--st-1c1714)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Defaults"}
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {activeSection === "danger" && (
                <div>
                  <h3 style={{ color: "#E0533B", marginBottom: 8 }}>Danger Zone</h3>
                  <p style={{ color: "var(--st-7a6a59)", fontSize: 13, marginBottom: 20 }}>
                    These actions are irreversible. Proceed with caution.
                  </p>
                  {[
                    {
                      title: "Revoke all cards",
                      desc: "Immediately revokes all active AgiCards. Your agents will lose all spending permissions.",
                      action: revoking ? "Revoking…" : "Revoke All Cards",
                      onClick: revokeAll,
                    },
                    {
                      title: "Disconnect & clear",
                      desc: "Disconnects your wallet and clears all local app data.",
                      action: "Disconnect & Clear",
                      onClick: () => { disconnect(); onBack(); },
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{
                        background: "rgba(224,83,59,0.04)",
                        border: "1px solid rgba(224,83,59,0.2)",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#E0533B", marginBottom: 4 }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--st-7a6a59)", lineHeight: 1.5 }}>
                          {item.desc}
                        </div>
                      </div>
                      <button
                        onClick={item.onClick}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid rgba(224,83,59,0.4)",
                          background: "rgba(224,83,59,0.08)",
                          color: "#E0533B",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {item.action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
