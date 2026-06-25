import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Bot,
  Activity,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Flame,
  Copy,
  Plus,
  Home,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Logo } from "./Logo";
import { useWallet } from "../WalletProvider";
import { useCards } from "../useCards";
import { useExecutions, timeAgo } from "../useExecutions";
import { useUsdcBalance } from "../useBalance";
import { EXPLORER_URL } from "@/lib/v2/chains";
import { cardGradient } from "../cardColors";
import type { AgentExecution } from "@/lib/v2/types";

interface DashboardProps {
  onGoHome: () => void;
  onCardDetail: (id: string) => void;
  onCreateCard: (description?: string) => void;
  onActivity: () => void;
  onSettings: () => void;
}

type SpendRange = "1D" | "1W" | "1M" | "ALL";

// Build a real spending series from confirmed executions, bucketed by the range.
function buildSpendSeries(range: SpendRange, execs: AgentExecution[]) {
  const confirmed = execs.filter((e) => e.status === "confirmed");
  const now = new Date();

  if (range === "1D") {
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(now.getHours() - (23 - i), 0, 0, 0);
      return { t: `${String(d.getHours()).padStart(2, "0")}:00`, key: d.getTime(), v: 0 };
    });
    confirmed.forEach((e) => {
      const d = new Date(e.createdAt);
      d.setMinutes(0, 0, 0);
      const b = buckets.find((x) => x.key === d.getTime());
      if (b) b.v += e.amountUsd;
    });
    return buckets.map(({ t, v }) => ({ t, v: Number(v.toFixed(2)) }));
  }

  if (range === "1W" || range === "1M") {
    const days = range === "1W" ? 7 : 30;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const label = days <= 7 ? d.toLocaleDateString(undefined, { weekday: "short" }) : `${d.getMonth() + 1}/${d.getDate()}`;
      return { t: label, key: d.getTime(), v: 0 };
    });
    confirmed.forEach((e) => {
      const d = new Date(e.createdAt);
      d.setHours(0, 0, 0, 0);
      const b = buckets.find((x) => x.key === d.getTime());
      if (b) b.v += e.amountUsd;
    });
    return buckets.map(({ t, v }) => ({ t, v: Number(v.toFixed(2)) }));
  }

  // ALL: group by month.
  const map = new Map<string, number>();
  confirmed.forEach((e) => {
    const key = new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    map.set(key, (map.get(key) ?? 0) + e.amountUsd);
  });
  const entries = [...map.entries()];
  return entries.length ? entries.map(([t, v]) => ({ t, v: Number(v.toFixed(2)) })) : [{ t: "—", v: 0 }];
}


export function Dashboard({ onGoHome, onCardDetail, onCreateCard, onActivity, onSettings }: DashboardProps) {
  const { address, short, disconnect } = useWallet();
  const walletLabel = short(address) || "Not connected";
  const usdc = useUsdcBalance(address);
  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Search, notifications, and the wallet menu.
  const [query, setQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  useEffect(() => {
    setLastSeen(Number(localStorage.getItem("agicards:notifsSeen") || 0));
  }, []);

  // Live executions for the Recent Activity panel.
  const { executions } = useExecutions();

  // Live cards from the backend, mapped to the dashboard's display shape.
  // Revoked cards drop off the dashboard entirely (the card detail page still
  // shows them with a REVOKED badge for history).
  const { cards: rawCards } = useCards();
  const cards = rawCards
    .filter((c) => c.status !== "revoked")
    .map((c) => ({
    id: c.id,
    label: c.label,
    task: c.intent.purpose,
    protocol: c.intent.allowedTargets[0] ?? "x402",
    spent: c.spentUsd,
    limit: c.intent.dailyCapUsd,
    delegate: c.delegate,
    unit: "daily",
    status: c.status,
    color: c.status === "active" ? "#1FA864" : "#FF5A12",
  }));

  // Derived search / notification values (depend on cards + executions above).
  const q = query.trim().toLowerCase();
  const visibleCards = q
    ? cards.filter((c) => c.task.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.protocol.toLowerCase().includes(q))
    : cards;
  const visibleActivity = q
    ? executions.filter((e) => e.summary.toLowerCase().includes(q))
    : executions;
  const unread = executions.filter((e) => new Date(e.createdAt).getTime() > lastSeen).length;
  const toggleNotifs = () => {
    const opening = !showNotifs;
    setShowNotifs(opening);
    setShowWalletMenu(false);
    if (opening) {
      const now = Date.now();
      localStorage.setItem("agicards:notifsSeen", String(now));
      setLastSeen(now);
    }
  };

  const [activeNav, setActiveNav] = useState("dashboard");
  const [spendRange, setSpendRange] = useState<SpendRange>("1W");
  const [selectedCard, setSelectedCard] = useState("1");
  const [cardInput, setCardInput] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [pausedAgents, setPausedAgents] = useState<string[]>(["4"]);

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "cards", icon: <CreditCard size={18} />, label: "Cards", action: () => setShowCards(true) },
    { id: "agents", icon: <Bot size={18} />, label: "Agents", action: () => setShowAgents(true) },
    { id: "activity", icon: <Activity size={18} />, label: "Activity", action: onActivity },
    { id: "settings", icon: <Settings size={18} />, label: "Settings", action: onSettings },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    if (item.action) item.action();
  };

  const totalSpent = cards.filter(c => c.status === "active").reduce((a, c) => a + c.spent, 0);
  const totalBudget = cards.filter(c => c.status === "active").reduce((a, c) => a + c.limit, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div style={{ background: "#FDF8F0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <nav
        style={{
          background: "white",
          borderBottom: "1px solid #EFE6D8",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onGoHome} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={28} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "#1C1714" }}>AgiCards</span>
          </button>
        </div>

        {/* Search */}
        <div
          className="hidden md:flex"
          style={{
            flex: 1,
            maxWidth: 320,
            alignItems: "center",
            gap: 8,
            background: "#F8F2E9",
            border: "1px solid #EFE6D8",
            borderRadius: 8,
            padding: "6px 12px",
          }}
        >
          <Search size={14} color="#7A6A59" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards, activity…"
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

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onGoHome}
            title="Back to home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#F8F2E9",
              border: "1px solid #EFE6D8",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              color: "#7A6A59",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Home size={15} /> Home
          </button>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={toggleNotifs}
              title="Notifications"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7A6A59", position: "relative", display: "flex", alignItems: "center" }}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span style={{ position: "absolute", top: -5, right: -6, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 8, background: "#FF5A12", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                  {unread}
                </span>
              )}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 300, background: "white", border: "1px solid #EFE6D8", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", zIndex: 60, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #EFE6D8", fontWeight: 700, fontSize: 13, color: "#1C1714" }}>Notifications</div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {executions.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 12.5, color: "#9A8A79" }}>No notifications yet.</div>
                  ) : (
                    executions.slice(0, 12).map((e) => (
                      <div key={e.id} style={{ padding: "10px 14px", borderBottom: "1px solid #F2EADF", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 5, background: e.status === "reverted" ? "#E0533B" : "#1FA864", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, color: "#1C1714" }}>{e.summary}</div>
                          <div style={{ fontSize: 10.5, color: "#9A8A79", marginTop: 2 }}>{timeAgo(e.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Wallet chip + menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowWalletMenu((v) => !v); setShowNotifs(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8F2E9", border: "1px solid #EFE6D8", borderRadius: 20, padding: "4px 12px 4px 8px", fontSize: 12, cursor: "pointer" }}
            >
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #FFB331, #FF5A12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={12} color="#fff" />
              </div>
              <span style={{ color: "#1C1714", fontFamily: "monospace" }}>{walletLabel}</span>
              <ChevronDown size={12} color="#7A6A59" />
            </button>
            {showWalletMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: "white", border: "1px solid #EFE6D8", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", zIndex: 60, overflow: "hidden" }}>
                <button onClick={() => { copyAddress(); setShowWalletMenu(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #F2EADF", cursor: "pointer", fontSize: 13, color: "#1C1714" }}>
                  {copied ? "Copied!" : "Copy address"}
                </button>
                <a href={`${EXPLORER_URL}/address/${address ?? ""}`} target="_blank" rel="noreferrer" onClick={() => setShowWalletMenu(false)} style={{ display: "block", padding: "10px 14px", borderBottom: "1px solid #F2EADF", fontSize: 13, color: "#1C1714", textDecoration: "none" }}>
                  View on Basescan
                </a>
                <button onClick={() => { setShowWalletMenu(false); disconnect(); onGoHome(); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#E0533B", fontWeight: 600 }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {(showNotifs || showWalletMenu) && (
        <div
          onClick={() => { setShowNotifs(false); setShowWalletMenu(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 55 }}
        />
      )}

      <div style={{ display: "flex", flex: 1 }}>
        {/* Left icon rail (desktop) — collapsible */}
        <div
          className="hidden md:flex"
          style={{
            width: navCollapsed ? 64 : 200,
            background: "white",
            borderRight: "1px solid #EFE6D8",
            flexDirection: "column",
            padding: "16px 0 0",
            gap: 2,
            flexShrink: 0,
            transition: "width 0.2s ease",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: navCollapsed ? "center" : "flex-start",
                gap: 10,
                padding: navCollapsed ? "10px 0" : "10px 16px",
                background: activeNav === item.id ? "linear-gradient(135deg, #FFE45D15, #FF5A1215)" : "none",
                border: "none",
                borderLeft: activeNav === item.id ? "2px solid #FFB331" : "2px solid transparent",
                cursor: "pointer",
                color: activeNav === item.id ? "#FF5A12" : "#7A6A59",
                fontSize: 13,
                fontWeight: activeNav === item.id ? 600 : 400,
                textAlign: "left",
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {item.icon}
              {!navCollapsed && item.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Collapse toggle (bottom) */}
          <button
            onClick={() => setNavCollapsed((v) => !v)}
            aria-label={navCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: navCollapsed ? "center" : "flex-start",
              gap: 10,
              padding: navCollapsed ? "14px 0" : "14px 18px",
              background: "none",
              border: "none",
              borderTop: "1px solid #F2EADF",
              cursor: "pointer",
              color: "#9A8A79",
              fontSize: 13,
              width: "100%",
            }}
          >
            {navCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!navCollapsed && "Collapse"}
          </button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "20px", overflowY: "auto", minWidth: 0 }}>
          {/* Your Cards row */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ color: "#1C1714" }}>Your Cards</h3>
              <button
                onClick={() => onCreateCard(cardInput)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                  color: "#1C1714",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Plus size={14} /> New Card
              </button>
            </div>
            {visibleCards.length === 0 && (
              <div style={{ padding: "26px", textAlign: "center", color: "#9A8A79", fontSize: 13, background: "white", border: "1px dashed #EFE6D8", borderRadius: 12 }}>
                {q ? "No cards match your search." : (<>No cards yet. Click <strong style={{ color: "#FF5A12" }}>New Card</strong> to mint your first one.</>)}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {visibleCards.map((card) => {
                const pct = card.limit > 0 ? (card.spent / card.limit) * 100 : 0;
                const isSelected = selectedCard === card.id;
                const gradient = cardGradient(card.id);
                const revoked = card.status !== "active";
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card.id);
                      onCardDetail(card.id);
                    }}
                    style={{
                      background: gradient,
                      borderRadius: 14,
                      border: isSelected ? "2px solid rgba(255,255,255,0.9)" : "1px solid rgba(0,0,0,0.06)",
                      padding: 16,
                      cursor: "pointer",
                      opacity: revoked ? 0.55 : 1,
                      boxShadow: isSelected ? "0 8px 22px rgba(0,0,0,0.18)" : "0 4px 14px rgba(0,0,0,0.10)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {card.task}
                      </span>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: revoked ? "#7A1B1B" : "#1FA864",
                          border: "1.5px solid rgba(255,255,255,0.75)",
                          flexShrink: 0,
                          marginTop: 3,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", marginBottom: 6, fontFamily: "monospace" }}>
                      {card.protocol}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(0,0,0,0.85)", marginBottom: 4 }}>
                      ${card.spent.toFixed(2)}
                      <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(0,0,0,0.5)" }}>
                        {" "}/ ${card.limit} {card.unit}
                      </span>
                    </div>
                    {/* budget bar */}
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(0,0,0,0.15)",
                        marginTop: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          width: `${Math.min(pct, 100)}%`,
                          background: "rgba(255,255,255,0.9)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle row: Create Card + Run Agent */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Create a card */}
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid #EFE6D8",
                padding: 20,
                boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
              }}
            >
              <h4 style={{ color: "#1C1714", marginBottom: 4 }}>Create a Card</h4>
              <p style={{ color: "#7A6A59", fontSize: 12, marginBottom: 12 }}>
                What should your agent pay for? You&apos;ll set the limits next.
              </p>
              <textarea
                value={cardInput}
                onChange={(e) => setCardInput(e.target.value)}
                placeholder="e.g. AI tools, cloud compute, data feeds"
                style={{
                  width: "100%",
                  background: "#F8F2E9",
                  border: "1px solid #EFE6D8",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#1C1714",
                  outline: "none",
                  resize: "none",
                  minHeight: 80,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => onCreateCard(cardInput)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                  color: "#1C1714",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Set limits &amp; mint →
              </button>
            </div>

          </div>

          {/* Spending chart + Card limits */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Spending chart */}
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid #EFE6D8",
                padding: 20,
                boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h4 style={{ color: "#1C1714" }}>Spending</h4>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["1D", "1W", "1M", "ALL"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSpendRange(r)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: "1px solid #EFE6D8",
                        background: spendRange === r ? "linear-gradient(135deg, #FFB331, #FF5A12)" : "transparent",
                        color: spendRange === r ? "#1C1714" : "#7A6A59",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={buildSpendSeries(spendRange, executions)}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB331" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFB331" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#7A6A59" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7A6A59" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #EFE6D8",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={((v: number) => [`$${v}`, "Spent"]) as never}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#FFB331"
                    strokeWidth={2}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Card limits */}
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid #EFE6D8",
                padding: 20,
                boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
              }}
            >
              <h4 style={{ color: "#1C1714", marginBottom: 16 }}>Card Limits</h4>
              {/* Circular ring */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <svg width={80} height={80} viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#F8F2E9" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="#FFB331"
                      strokeWidth="8"
                      strokeDasharray={`${(budgetPct / 100) * 201} 201`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1C1714" }}>{budgetPct}%</span>
                    <span style={{ fontSize: 9, color: "#7A6A59" }}>used</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, textAlign: "center", color: "#7A6A59", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "#1C1714" }}>${totalSpent.toFixed(2)}</span>
                {" "}of{" "}
                <span style={{ fontWeight: 700, color: "#1C1714" }}>${totalBudget}/day</span>
              </div>
              {cards.filter(c => c.status === "active").map((card) => (
                <div key={card.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                    <span style={{ color: "#7A6A59", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{card.task}</span>
                    <span style={{ color: "#1C1714", fontWeight: 600 }}>
                      ${card.spent}/${card.limit}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "#F8F2E9" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        width: `${(card.spent / card.limit) * 100}%`,
                        background: "linear-gradient(90deg, #FFB331, #FF5A12)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              border: "1px solid #EFE6D8",
              padding: 16,
              marginBottom: 20,
              boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4 style={{ color: "#1C1714" }}>Recent Activity</h4>
              <button
                onClick={onActivity}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#FFB331", fontSize: 11 }}
              >
                View all
              </button>
            </div>
            {visibleActivity.length === 0 ? (
              <div style={{ fontSize: 12, color: "#9A8A79", padding: "4px 0 8px" }}>{q ? "No matching activity." : "No activity yet."}</div>
            ) : (
              visibleActivity.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #EFE6D8" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1714", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.summary}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tx.status === "reverted" ? "#E0533B" : "#1C1714", flexShrink: 0 }}>
                      ${tx.amountUsd.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {tx.txHash ? (
                      <a href={`${EXPLORER_URL}/tx/${tx.txHash}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontFamily: "monospace", color: "#7A6A59", textDecoration: "none" }}>
                        {short(tx.txHash)}
                      </a>
                    ) : (
                      <span style={{ fontSize: 10, color: "#B0892F", fontWeight: 600 }}>{tx.status}</span>
                    )}
                    <span style={{ fontSize: 10, color: "#7A6A59", marginLeft: "auto" }}>{timeAgo(tx.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel */}
        <div
          className="hidden lg:flex"
          style={{
            width: 260,
            flexDirection: "column",
            gap: 16,
            padding: "20px 16px 20px 0",
            flexShrink: 0,
          }}
        >
          {/* Account */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              border: "1px solid #EFE6D8",
              padding: 16,
              boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
            }}
          >
            <h4 style={{ color: "#1C1714", marginBottom: 12 }}>Account</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFB331, #FF5A12)",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <User size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#7A6A59" }}>Wallet</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#1C1714", fontWeight: 600 }}>
                  {walletLabel}
                </div>
              </div>
              <button
                onClick={copyAddress}
                title={copied ? "Copied!" : "Copy address"}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: copied ? "#1FA864" : "#7A6A59" }}
              >
                <Copy size={12} />
              </button>
            </div>
            {[
              { label: "Balance", value: usdc != null ? `${Number(usdc).toFixed(2)} USDC` : "…" },
              { label: "Provider", value: "MetaMask" },
              { label: "Account type", value: "Smart (7702)" },
              { label: "Network", value: "Base" },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #EFE6D8",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#7A6A59" }}>{row.label}</span>
                <span style={{ color: "#1C1714", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
            <button
              onClick={() => { disconnect(); onGoHome(); }}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "7px",
                borderRadius: 7,
                border: "1px solid #EFE6D8",
                background: "none",
                color: "#E0533B",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Disconnect
            </button>
          </div>

          {/* Revoke a Card */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              border: "1px solid #EFE6D8",
              padding: 16,
              boxShadow: "0 1px 4px rgba(28,23,20,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Flame size={16} color="#E0533B" />
              <h4 style={{ color: "#1C1714" }}>Revoke a Card</h4>
            </div>
            <p style={{ fontSize: 11, color: "#7A6A59", marginBottom: 10, lineHeight: 1.5 }}>
              Instantly revoke a card so the agent can no longer spend.
            </p>
            <button
              onClick={() => setShowCards(true)}
              style={{
                width: "100%",
                padding: "7px",
                borderRadius: 7,
                border: "1px solid rgba(224,83,59,0.3)",
                background: "rgba(224,83,59,0.06)",
                color: "#E0533B",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Flame size={12} /> Select Card to Revoke
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div
        className="flex md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #EFE6D8",
          padding: "8px 0 4px",
          zIndex: 50,
          justifyContent: "space-around",
        }}
      >
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: activeNav === item.id ? "#FF5A12" : "#7A6A59",
              padding: "4px 8px",
              minWidth: 44,
              minHeight: 44,
            }}
          >
            {item.icon}
            <span style={{ fontSize: 9 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {showCards && (
        <div
          onClick={() => setShowCards(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(20,10,5,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 640, background: "#FFFDFA",
              borderRadius: 16, border: "1px solid #EFE6D8",
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)", padding: 24, position: "relative",
            }}
          >
            <button
              onClick={() => setShowCards(false)}
              aria-label="Close"
              style={{
                position: "absolute", top: 14, right: 16, width: 28, height: 28,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)",
                cursor: "pointer", fontSize: 16, color: "#666",
              }}
            >×</button>
            <h3 style={{ color: "#1C1714", marginBottom: 4 }}>Your Cards</h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 18 }}>Select a card to view its details.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {cards.map((card) => {
                const pct = (card.spent / card.limit) * 100;
                return (
                  <div
                    key={card.id}
                    onClick={() => { onCardDetail(card.id); setShowCards(false); }}
                    style={{
                      background: "white", borderRadius: 12, border: "1px solid #EFE6D8",
                      padding: 16, cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1C1714", fontSize: 14 }}>{card.task}</div>
                        <div style={{ fontSize: 11, color: "#9A8A79", marginTop: 2 }}>{card.protocol}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: card.color, marginTop: 4 }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1714" }}>
                      ${card.spent.toFixed(2)}{" "}
                      <span style={{ fontSize: 12, fontWeight: 400, color: "#9A8A79" }}>/ ${card.limit} {card.unit}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "#F2EADF", marginTop: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: pct > 80 ? "#E0533B" : "linear-gradient(90deg, #FFB331, #FF5A12)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAgents && (
        <div
          onClick={() => setShowAgents(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(20,10,5,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560, background: "#FFFDFA",
              borderRadius: 16, border: "1px solid #EFE6D8",
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)", padding: 24, position: "relative",
            }}
          >
            <button
              onClick={() => setShowAgents(false)}
              aria-label="Close"
              style={{
                position: "absolute", top: 14, right: 16, width: 28, height: 28,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)",
                cursor: "pointer", fontSize: 16, color: "#666",
              }}
            >×</button>
            <h3 style={{ color: "#1C1714", marginBottom: 4 }}>Agents</h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 18 }}>
              {cards.filter((c) => !pausedAgents.includes(c.id)).length} active ·{" "}
              {cards.filter((c) => pausedAgents.includes(c.id)).length} paused ·{" "}
              ${cards.reduce((a, c) => a + (pausedAgents.includes(c.id) ? 0 : c.spent), 0).toFixed(2)} spent today
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cards.map((card, i) => {
                const online = !pausedAgents.includes(card.id);
                const key = short(card.delegate);
                const time = ["2 min ago", "1 hr ago", "12 min ago", "3 hr ago"][i] || "—";
                return (
                  <div
                    key={card.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, background: "white", border: "1px solid #EFE6D8",
                      borderRadius: 12, padding: "12px 14px",
                    }}
                  >
                    <div
                      onClick={() => { onCardDetail(card.id); setShowAgents(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, cursor: "pointer" }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #FFB331, #FF5A12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Bot size={18} color="#fff" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontWeight: 600, color: "#1C1714", fontSize: 14 }}>{card.label}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: online ? "#1FA864" : "#9A8A79" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: online ? "#1FA864" : "#C9BCAD" }} />
                            {online ? "Online" : "Paused"}
                          </span>
                          <span style={{ fontSize: 11, color: "#B0A293" }}>
                            {online ? `last spend ${time}` : "idle"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#7A6A59", marginTop: 2 }}>
                          ${card.spent.toFixed(2)} / ${card.limit} {card.unit}
                        </div>
                        <div style={{ fontSize: 11, color: "#A89A88", fontFamily: "monospace", marginTop: 1 }}>{key}</div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPausedAgents((prev) =>
                          prev.includes(card.id) ? prev.filter((x) => x !== card.id) : [...prev, card.id]
                        )
                      }
                      style={{
                        flexShrink: 0, fontSize: 12, fontWeight: 500,
                        padding: "6px 12px", borderRadius: 8, border: "1px solid #EFE6D8",
                        background: online ? "white" : "linear-gradient(135deg, #FFB331, #FF5A12)",
                        color: online ? "#9A8A79" : "#1C1714", cursor: "pointer",
                      }}
                    >
                      {online ? "Pause" : "Resume"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
