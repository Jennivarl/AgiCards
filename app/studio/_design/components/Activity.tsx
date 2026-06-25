import { useState } from "react";
import {
  ArrowLeft,
  Search,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useExecutions } from "../useExecutions";
import { useCards } from "../useCards";
import { EXPLORER_URL } from "@/lib/v2/chains";

interface ActivityProps {
  onBack: () => void;
}

export function Activity({ onBack }: ActivityProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "reverted">("all");

  const { executions } = useExecutions();
  const { cards } = useCards();
  const cardLabel = (id: string) => cards.find((c) => c.id === id)?.label ?? `${id.slice(0, 6)}…`;

  // Map executions to the table's display shape.
  const rows = executions.map((ex) => ({
    id: ex.id,
    time: new Date(ex.createdAt).toLocaleString(),
    card: cardLabel(ex.cardId),
    action: ex.status === "reverted" ? "Reverted" : "Payment",
    amount: `$${ex.amountUsd.toFixed(2)}`,
    status: ex.status === "confirmed" ? "success" : ex.status === "reverted" ? "reverted" : "pending",
    hash: ex.txHash ? `${ex.txHash.slice(0, 6)}…${ex.txHash.slice(-4)}` : "—",
    fullHash: ex.txHash ?? "—",
    recipient: ex.target,
  }));

  const filtered = rows.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      tx.card.toLowerCase().includes(q) ||
      tx.action.toLowerCase().includes(q) ||
      tx.hash.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || tx.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSpent = rows
    .filter((t) => t.status === "success")
    .reduce((a, t) => a + parseFloat(t.amount.replace("$", "")), 0);

  const summary = [
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
    { label: "Transactions", value: rows.length },
    { label: "Cards Active", value: cards.filter((c) => c.status === "active").length },
    { label: "Reverts", value: rows.filter((t) => t.status === "reverted").length },
  ];

  function exportCsv() {
    const header = ["Time", "Card", "Action", "Amount", "Status", "Tx Hash", "Recipient"];
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const body = rows.map((r) =>
      [r.time, r.card, r.action, r.amount, r.status, r.fullHash, r.recipient].map(cell).join(",")
    );
    const csv = [header.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "agicards-activity.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ background: "#FDF8F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
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
            <h2 style={{ color: "#1C1714" }}>Activity</h2>
          </div>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #EFE6D8",
              background: "white",
              color: "#1C1714",
              cursor: rows.length === 0 ? "not-allowed" : "pointer",
              opacity: rows.length === 0 ? 0.5 : 1,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Summary tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {summary.map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #EFE6D8",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
              }}
            >
              <div style={{ fontSize: 11, color: "#7A6A59", marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1C1714" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              border: "1px solid #EFE6D8",
              borderRadius: 8,
              padding: "7px 12px",
              flex: "1 1 200px",
            }}
          >
            <Search size={14} color="#7A6A59" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search card, action, hash…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#1C1714",
                width: "100%",
              }}
            />
          </div>
          {(["all", "success", "reverted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #EFE6D8",
                background: filterStatus === s ? "linear-gradient(135deg, #FFB331, #FF5A12)" : "white",
                color: filterStatus === s ? "#1C1714" : "#7A6A59",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table (desktop) */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid #EFE6D8",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
            marginBottom: 24,
          }}
        >
          {/* Table header */}
          <div
            className="hidden md:grid"
            style={{
              display: "grid",
              gridTemplateColumns: "160px 120px 120px 80px 100px 120px",
              padding: "10px 16px",
              background: "#FDF8F0",
              borderBottom: "1px solid #EFE6D8",
              gap: 8,
            }}
          >
            {["Time", "Card", "Action", "Amount", "Status", "Tx Hash"].map((h) => (
              <span key={h} style={{ fontSize: 10, color: "#7A6A59", fontWeight: 700, letterSpacing: 0.5 }}>
                {h}
              </span>
            ))}
          </div>

          {filtered.map((tx) => {
            const isExpanded = expandedId === tx.id;
            return (
              <div key={tx.id}>
                {/* Desktop row */}
                <div
                  className="hidden md:grid"
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 120px 120px 80px 100px 120px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #EFE6D8",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    background: isExpanded ? "#FDF8F0" : "white",
                    transition: "background 0.1s",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#7A6A59", fontFamily: "monospace" }}>
                    {tx.time}
                  </span>
                  <span style={{ fontSize: 12, color: "#1C1714", fontWeight: 600 }}>{tx.card}</span>
                  <span style={{ fontSize: 12, color: "#7A6A59" }}>{tx.action}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1714" }}>{tx.amount}</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background:
                        tx.status === "success"
                          ? "rgba(31,168,100,0.12)"
                          : "rgba(224,83,59,0.12)",
                      color: tx.status === "success" ? "#1FA864" : "#E0533B",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {tx.status === "success" ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {tx.status}
                  </span>
                  <div
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
                      cursor: "pointer",
                    }}
                  >
                    {tx.hash} <ExternalLink size={9} />
                  </div>
                </div>

                {/* Mobile card */}
                <div
                  className="flex md:hidden"
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #EFE6D8",
                    cursor: "pointer",
                    background: isExpanded ? "#FDF8F0" : "white",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1714" }}>{tx.card}</span>
                      <span style={{ fontSize: 12, color: "#7A6A59", marginLeft: 8 }}>{tx.action}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1C1714" }}>{tx.amount}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        background: tx.status === "success" ? "rgba(31,168,100,0.12)" : "rgba(224,83,59,0.12)",
                        color: tx.status === "success" ? "#1FA864" : "#E0533B",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {tx.status}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#7A6A59" }}>{tx.hash}</span>
                    <Clock size={10} color="#7A6A59" />
                    <span style={{ fontSize: 10, color: "#7A6A59" }}>{tx.time}</span>
                  </div>
                </div>

                {/* Expanded drawer */}
                {isExpanded && (
                  <div
                    style={{
                      background: "#FDF8F0",
                      borderBottom: "1px solid #EFE6D8",
                      padding: "16px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {[
                        { label: "Full Tx Hash", value: tx.fullHash, mono: true },
                        { label: "Recipient", value: tx.recipient, mono: true },
                      ].map((row) => (
                        <div key={row.label}>
                          <div style={{ fontSize: 10, color: "#7A6A59", marginBottom: 4, fontWeight: 700, letterSpacing: 0.5 }}>
                            {row.label}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: row.mono ? "monospace" : "inherit",
                              color: "#1C1714",
                              wordBreak: "break-all",
                            }}
                          >
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {tx.fullHash !== "—" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <a
                          href={`${EXPLORER_URL}/tx/${tx.fullHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "5px 12px",
                            borderRadius: 6,
                            border: "1px solid #EFE6D8",
                            background: "white",
                            color: "#1C1714",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={10} /> Basescan
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
