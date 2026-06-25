"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Shield, Zap, Wallet, FileCheck, ChevronDown, ArrowDown, Sun, Moon } from "lucide-react";
import { useWallet } from "../WalletProvider";
import { useTheme } from "../ThemeProvider";

function AgiCard({ rotate, translateX, translateY, zIndex, scale, blur, gradient = "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)", last4 = "1661", amount = "$20 / day" }: {
  rotate: number; translateX: number; translateY: number; zIndex: number; scale: number; blur?: number; gradient?: string; last4?: string; amount?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width: "340px",
        height: "210px",
        borderRadius: "20px",
        background: gradient,
        transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
        zIndex,
        filter: blur ? `blur(${blur}px)` : undefined,
        boxShadow: `0 30px 80px rgba(255, 120, 20, 0.35), 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)`,
        overflow: "hidden",
      }}
    >
      {/* glossy sheen streak */}
      <div style={{
        position: "absolute", top: "-30px", left: "-60px",
        width: "200px", height: "300px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 60%)",
        transform: "rotate(20deg)",
        pointerEvents: "none",
      }} />
      {/* EMV chip */}
      <div style={{
        position: "absolute", top: "38px", left: "28px",
        width: "42px", height: "32px", borderRadius: "6px",
        background: "linear-gradient(135deg, #FFE89A 0%, #EAC24E 42%, #CDA032 72%, #AD8526 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 1px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px", padding: "4px" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: "7px", height: "5px", borderRadius: "1px", background: "rgba(0,0,0,0.2)" }} />
          ))}
        </div>
      </div>
      {/* Dots square */}
      <div style={{
        position: "absolute", top: "36px", right: "26px",
        width: "44px", height: "34px",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.42) 1.5px, transparent 1.8px)",
        backgroundSize: "11px 11px",
      }} />
      {/* Card number */}
      <div style={{ position: "absolute", bottom: "44px", left: "28px", right: "28px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "15px", letterSpacing: "0.12em", color: "rgba(0,0,0,0.65)", fontWeight: 600 }}>
          •••• •••• •••• {last4}
        </span>
      </div>
      {/* Bottom row */}
      <div style={{ position: "absolute", bottom: "20px", left: "28px", right: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "8px", letterSpacing: "0.1em", color: "rgba(0,0,0,0.45)", textTransform: "uppercase" as const, fontFamily: "system-ui" }}>AGENT CARD · x402</div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.6)", fontFamily: "system-ui" }}>{amount}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/brand/base.jpg" alt="Base" width={24} height={24} style={{ display: "block", borderRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div style={{
      background: "rgba(var(--st-glass-rgb),0.8)",
      border: "1px solid rgba(var(--st-line-rgb),0.07)",
      borderRadius: "18px", padding: "26px 24px",
      boxShadow: "0 10px 30px rgba(120,70,20,0.06)",
    }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(255,228,93,0.35), rgba(255,90,18,0.18))",
        border: "1px solid rgba(255,120,20,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#E8590C", marginBottom: "16px",
      }}>{icon}</div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 7px" }}>{title}</h3>
      <p style={{ fontSize: "13.5px", color: "var(--st-7c7264)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

const SECTION_BY_LABEL: Record<string, string> = { Home: "top", Cards: "cards", Features: "features", Docs: "docs", FAQ: "faq" };

export function Landing({ onLaunchApp }: { onLaunchApp: () => void }) {
  const { address, short } = useWallet();
  const { theme, toggle: toggleTheme } = useTheme();
  const [glowPulse, setGlowPulse] = useState(0.85);
  const [showHow, setShowHow] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let frame: number;
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      setGlowPulse(Math.sin((ts - start) / 2400) * 0.15 + 0.85);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the nav link for the section in view.
  useEffect(() => {
    const ids = ["top", "cards", "features", "security", "faq"];
    const labelById = Object.fromEntries(Object.entries(SECTION_BY_LABEL).map(([l, id]) => [id, l]));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(labelById[e.target.id]); });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const links: { label: string; id?: string; onClick?: () => void }[] = [
    { label: "Home", id: "top" },
    { label: "App", onClick: onLaunchApp },
    { label: "Cards", id: "cards" },
    { label: "Features", id: "features" },
    { label: "Docs", id: "docs" },
    { label: "FAQ", id: "faq" },
  ];

  const handleNav = (l: { id?: string; onClick?: () => void }) => {
    if (l.onClick) return l.onClick();
    if (l.id === "top") return window.scrollTo({ top: 0, behavior: "smooth" });
    if (l.id) document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const brandRow = ([
    { name: "MetaMask", img: "/brand/metamask.svg" },
    { name: "Base", img: "/brand/base.jpg" },
    { name: "0G", img: "/brand/0g.jpg" },
    { name: "1Shot", img: "/brand/1shot.svg" },
    { name: "x402", fg: "#E8590C" },
  ] as { name: string; img?: string; fg?: string }[]);

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "var(--st-fdfcf9)",
      overflowX: "hidden",
      position: "relative",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── FIXED NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        pointerEvents: "none",
        background: scrolled ? "rgba(var(--st-glass-rgb),0.78)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(var(--st-line-rgb),0.07)" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, pointerEvents: "auto" }}>
          <img src="/AGI-LOGO.jpg" alt="AgiCards" style={{ height: "47px", width: "auto", display: "block" }} />
        </button>

        {/* Nav pill */}
        <div style={{
          background: "rgba(var(--st-glass-rgb),0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(var(--st-line-rgb),0.08)",
          borderRadius: "40px",
          padding: "8px 20px",
          display: "flex", alignItems: "center", gap: "24px",
          boxShadow: "0 2px 12px rgba(var(--st-line-rgb),0.06)",
          pointerEvents: "auto",
        }}>
          {links.map((l) => {
            const isActive = active === l.label;
            const isHover = hovered === l.label;
            return (
              <button
                key={l.label}
                onClick={() => handleNav(l)}
                onMouseEnter={() => setHovered(l.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  fontSize: "13px",
                  color: isHover ? "#E8590C" : isActive ? "var(--st-111)" : "var(--st-888)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontWeight: isActive ? 600 : 500,
                  transform: isHover ? "translateY(-2px) scale(1.18)" : "none",
                  textShadow: isHover ? "0 6px 16px rgba(255,120,20,0.4)" : "none",
                  transformOrigin: "center",
                  transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), color 0.18s",
                }}
              >{l.label}</button>
            );
          })}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "38px", height: "38px",
            background: "rgba(var(--st-glass-rgb),0.8)",
            border: "1px solid rgba(var(--st-line-rgb),0.1)",
            borderRadius: "50%",
            color: "var(--st-333)", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(var(--st-line-rgb),0.06)",
            pointerEvents: "auto",
          }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Connect Wallet */}
        <button style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(var(--st-glass-rgb),0.8)",
          border: "1px solid rgba(var(--st-line-rgb),0.1)",
          borderRadius: "40px", padding: "9px 18px",
          color: "var(--st-333)", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          boxShadow: "0 2px 8px rgba(var(--st-line-rgb),0.06)",
          pointerEvents: "auto",
        }} onClick={onLaunchApp}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--st-555)" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          {address ? short(address) : "Connect Wallet"}
        </button>
      </nav>

      {/* ── HERO ── */}
      <section id="top" style={{ padding: "14px", minHeight: "100vh" }}>
        <div style={{
          width: "100%",
          height: "calc(100vh - 28px)",
          background: "var(--st-f7f0e2)",
          borderRadius: "22px",
          border: "1.5px solid rgba(var(--st-line-rgb),0.08)",
          boxShadow: "0 18px 50px rgba(var(--st-line-rgb),0.10)",
          position: "relative",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>

          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: "40%", left: "50%",
            transform: "translate(-50%, -65%)",
            width: "700px", height: "500px",
            background: `radial-gradient(ellipse, rgba(255,160,40,${0.18 * glowPulse}) 0%, rgba(255,100,20,${0.07 * glowPulse}) 50%, transparent 75%)`,
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "absolute", top: "36%", left: "50%",
            transform: "translate(-50%, -65%)",
            width: "380px", height: "280px",
            background: `radial-gradient(ellipse, rgba(255,220,80,${0.2 * glowPulse}) 0%, transparent 70%)`,
            pointerEvents: "none", zIndex: 0,
          }} />

          {/* Decorative dot squares */}
          <div style={{
            position: "absolute", top: "104px", left: "34px", zIndex: 1, pointerEvents: "none",
            width: "90px", height: "90px",
            backgroundImage: "radial-gradient(circle, rgba(200,110,40,0.5) 2px, transparent 2.4px)",
            backgroundSize: "18px 18px",
          }} />
          <div style={{
            position: "absolute", bottom: "84px", right: "34px", zIndex: 1, pointerEvents: "none",
            width: "90px", height: "90px",
            backgroundImage: "radial-gradient(circle, rgba(200,110,40,0.5) 2px, transparent 2.4px)",
            backgroundSize: "18px 18px",
          }} />

          {/* Floating dashboard preview widgets */}
          <div style={{
            position: "absolute", left: "78px", top: "50%", zIndex: 6,
            transform: "translateY(-50%) rotate(-4deg)",
            width: "212px",
            background: "rgba(var(--st-glass-rgb),0.72)",
            backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(var(--st-line-rgb),0.07)",
            borderRadius: "18px", padding: "16px 18px",
            boxShadow: "0 18px 44px rgba(120,70,20,0.14), 0 2px 8px rgba(var(--st-line-rgb),0.05)",
            animation: "floatA 7s ease-in-out infinite",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--st-8a7d6c)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>This week</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a" }}>+12%</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "7px", height: "58px", marginBottom: "10px" }}>
              {[42, 58, 34, 70, 50, 84, 62].map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, borderRadius: "4px 4px 2px 2px",
                  background: i === 5
                    ? "linear-gradient(180deg, #FFB331, #FF5A12)"
                    : "linear-gradient(180deg, rgba(255,179,49,0.55), rgba(255,90,18,0.4))",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em" }}>$84.20</span>
              <span style={{ fontSize: "11px", color: "var(--st-9b8f7e)" }}>spent</span>
            </div>
          </div>

          <div style={{
            position: "absolute", right: "78px", top: "50%", zIndex: 6,
            transform: "translateY(-50%) rotate(4deg)",
            width: "212px",
            background: "rgba(var(--st-glass-rgb),0.72)",
            backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(var(--st-line-rgb),0.07)",
            borderRadius: "18px", padding: "16px 18px",
            boxShadow: "0 18px 44px rgba(120,70,20,0.14), 0 2px 8px rgba(var(--st-line-rgb),0.05)",
            animation: "floatB 8s ease-in-out infinite",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--st-8a7d6c)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "12px" }}>Daily limit</div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <div style={{ position: "relative", width: "62px", height: "62px", flexShrink: 0 }}>
                <svg width="62" height="62" viewBox="0 0 62 62">
                  <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(var(--st-line-rgb),0.07)" strokeWidth="7" />
                  <circle cx="31" cy="31" r="26" fill="none" stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - 0.62)}`}
                    transform="rotate(-90 31 31)" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFB331" />
                      <stop offset="100%" stopColor="#FF5A12" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>62%</div>
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em" }}>$12.40</div>
                <div style={{ fontSize: "11px", color: "var(--st-9b8f7e)" }}>of $20.00</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", paddingTop: "11px", borderTop: "1px solid rgba(var(--st-line-rgb),0.06)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", animation: "pulseGreen 2s ease-in-out infinite" }} />
              <span style={{ fontSize: "11.5px", color: "var(--st-6b6256)", fontWeight: 500 }}>3 agents active</span>
            </div>
          </div>

          {/* MAIN HERO CONTENT */}
          <div style={{
            flex: 1, position: "relative", zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            paddingTop: "40px", paddingBottom: "64px",
          }}>

            {/* Card stack */}
            <div style={{ position: "relative", width: "560px", height: "310px", marginBottom: "28px", transform: "scale(0.85)" }}>
              <div style={{ position: "absolute", top: "50px", left: "60px", zIndex: 1 }}>
                <AgiCard rotate={-13} translateX={0} translateY={0} zIndex={1} scale={0.87} blur={0.8} gradient="linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #5B21B6 100%)"/>
              </div>
              <div style={{ position: "absolute", top: "28px", left: "88px", zIndex: 2 }}>
                <AgiCard rotate={-5} translateX={0} translateY={0} zIndex={2} scale={0.94} gradient="linear-gradient(135deg, #FFB3C7 0%, #FF6C9A 45%, #F0457E 100%)"/>
              </div>
              <div style={{ position: "absolute", top: "8px", left: "100px", zIndex: 3 }}>
                <AgiCard rotate={4} translateX={0} translateY={0} zIndex={3} scale={1} gradient="linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)"/>
              </div>
            </div>

            {/* Badge pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "rgba(var(--st-glass-rgb),0.75)",
              border: "1px solid rgba(var(--st-line-rgb),0.08)",
              borderRadius: "40px", padding: "6px 14px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(var(--st-line-rgb),0.06)",
            }}>
              <img src="/metamask-fox.svg" alt="MetaMask" width={15} height={15} style={{ display: "block" }} />
              <span style={{ fontSize: "12px", color: "var(--st-666)" }}>Powered by MetaMask Smart Accounts</span>
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 3.9vw, 50px)",
              fontWeight: 300, color: "var(--st-111)", textAlign: "center",
              letterSpacing: "-0.03em", lineHeight: 1.12,
              margin: "0 0 14px", maxWidth: "640px",
            }}>
              Permission cards<br/>for AI agents
            </h1>

            <p style={{
              fontSize: "15px", color: "var(--st-888)", textAlign: "center",
              maxWidth: "430px", lineHeight: 1.65, margin: "0 0 26px", fontWeight: 400,
            }}>
              Give your agent controlled on-chain powers, within limits the blockchain enforces.
            </p>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                style={{
                  background: "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                  border: "none", borderRadius: "40px", padding: "13px 28px",
                  fontSize: "14px", fontWeight: 700, color: "#1a0a00",
                  cursor: "pointer", letterSpacing: "0.01em",
                  boxShadow: "0 8px 32px rgba(255,120,20,0.35)",
                }}
                onClick={onLaunchApp}
              >Launch App ↗</button>
              <button
                style={{
                  background: "rgba(var(--st-glass-rgb),0.7)",
                  border: "1px solid rgba(var(--st-line-rgb),0.15)",
                  borderRadius: "40px", padding: "13px 28px",
                  fontSize: "14px", fontWeight: 500, color: "var(--st-333)",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(var(--st-line-rgb),0.06)",
                }}
                onClick={() => setShowHow(true)}
              >How it works</button>
            </div>
          </div>

          {/* Scroll down indicator */}
          <button
            onClick={() => document.getElementById("cards")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{
              position: "absolute", bottom: "24px", left: "34px", zIndex: 20,
              display: "flex", alignItems: "center", gap: "12px",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <span style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: "1px solid rgba(var(--st-line-rgb),0.14)",
              background: "rgba(var(--st-glass-rgb),0.6)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--st-555)", boxShadow: "0 2px 10px rgba(var(--st-line-rgb),0.06)",
              animation: "bounceDown 1.8s ease-in-out infinite",
            }}>
              <ArrowDown size={18} />
            </span>
          </button>

          {/* Hero bottom logo bar */}
          <div style={{
            position: "absolute", bottom: "20px", left: "28px", right: "28px",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
              {brandRow.map((b) =>
                b.img ? (
                  <div key={b.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <img src={b.img} alt={b.name} style={{ width: "18px", height: "18px", objectFit: "contain", borderRadius: "4px" }} />
                    <span style={{ fontSize: "12px", color: "var(--st-555)", fontWeight: 600, letterSpacing: "0.02em" }}>{b.name}</span>
                  </div>
                ) : (
                  <span key={b.name} style={{ color: b.fg, fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em" }}>{b.name}</span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CARDS SECTION ── */}
      <section id="cards" style={{ scrollMarginTop: "90px", padding: "110px 40px", maxWidth: "1140px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#E8590C", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Cards</span>
          <h2 style={{ fontSize: "clamp(15px, 1.4vw, 16px)", fontWeight: 700, color: "var(--st-111)", letterSpacing: "-0.03em", margin: "12px 0 10px" }}>A card for every agent</h2>
          <p style={{ fontSize: "15px", color: "var(--st-8a7d6c)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
            Make a card in seconds. A daily cap and expiry are enforced on chain, with a limit per charge on top.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 56px", justifyContent: "center" }}>
          {[
            { gradient: "linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)", last4: "1661", amount: "$20 / day", name: "Research agent", sub: "Pays for search & data APIs" },
            { gradient: "linear-gradient(135deg, #FFB3C7 0%, #FF6C9A 45%, #F0457E 100%)", last4: "0420", amount: "$50 / day", name: "Coding agent", sub: "Buys compute & model calls" },
            { gradient: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #5B21B6 100%)", last4: "7788", amount: "$100 / day", name: "Ops agent", sub: "Settles recurring services" },
          ].map((c) => (
            <div key={c.last4} style={{ width: "340px" }}>
              <div style={{ position: "relative", width: "340px", height: "210px", marginBottom: "18px" }}>
                <AgiCard rotate={0} translateX={0} translateY={0} zIndex={1} scale={1} gradient={c.gradient} last4={c.last4} amount={c.amount} />
              </div>
              <div style={{ paddingLeft: "4px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{c.name}</div>
                <div style={{ fontSize: "13px", color: "var(--st-8a7d6c)", marginTop: "2px" }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{ scrollMarginTop: "90px" }}>
        <div style={{ padding: "110px 40px", maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#E8590C", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Features</span>
            <h2 style={{ fontSize: "clamp(15px, 1.4vw, 16px)", fontWeight: 700, color: "var(--st-111)", letterSpacing: "-0.03em", margin: "12px 0 10px" }}>Built for autonomous spending</h2>
            <p style={{ fontSize: "15px", color: "var(--st-8a7d6c)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              Everything an agent needs to pay its own way, without ever touching your wallet.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            <InfoCard icon={<Shield size={22} />} title="Limits on chain" desc="Your daily cap and expiry are enforced by the smart account itself, not by a server that can be bypassed." />
            <InfoCard icon={<Zap size={22} />} title="One tap to approve" desc="Approve one permission in MetaMask. No seed phrase shared, and no blank cheque signed." />
            <InfoCard icon={<Wallet size={22} />} title="x402 payments" desc="Your agent settles payments in USDC through the card, always within the budget you set." />
            <InfoCard icon={<FileCheck size={22} />} title="0G audit trail" desc="Every spend is saved to 0G storage, giving you a clear history that no one can tamper with." />
          </div>
        </div>
      </section>

      {/* ── DOCS SECTION ── */}
      <section id="docs" style={{ scrollMarginTop: "90px", background: "#fff", borderTop: "1px solid rgba(var(--st-line-rgb),0.06)", borderBottom: "1px solid rgba(var(--st-line-rgb),0.06)" }}>
        <div style={{ padding: "100px 40px", maxWidth: "760px", margin: "0 auto" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#E8590C", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Docs</span>
          <h2 style={{ fontSize: "clamp(15px, 1.4vw, 16px)", fontWeight: 700, color: "var(--st-111)", letterSpacing: "-0.03em", margin: "12px 0 28px" }}>Whitepaper and roadmap</h2>

          <div style={{ fontSize: "15px", color: "var(--st-6b6256)", lineHeight: 1.75 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--st-111)", margin: "26px 0 8px" }}>Overview</h3>
            <p style={{ margin: 0 }}>
              AgiCards turns a MetaMask Smart Account permission into a scoped capability card for an AI agent, enforced on chain. The agent gets a controlled power, today spending, and can use it only within the limits the user sets. Funds never leave the user&apos;s account.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--st-111)", margin: "26px 0 8px" }}>How it works</h3>
            <p style={{ margin: "0 0 10px" }}><strong>1. Grant.</strong> The user approves one Advanced Permission (ERC-7715) in MetaMask: a daily USDC cap with an expiry, granted to the agent&apos;s session key. This also upgrades the user&apos;s account to an EIP-7702 smart account.</p>
            <p style={{ margin: "0 0 10px" }}><strong>2. Enforce.</strong> The cap and expiry are checked by the account&apos;s caveat enforcer on chain, not by a server. The agent can never exceed them.</p>
            <p style={{ margin: "0 0 10px" }}><strong>3. Redeem.</strong> A background agent redeems the delegation (ERC-7710) to run the action, for example an x402 USDC payment, on the user&apos;s behalf and inside the caveat.</p>
            <p style={{ margin: 0 }}><strong>4. Audit.</strong> Each execution is recorded to 0G storage, giving a verifiable trail.</p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--st-111)", margin: "26px 0 8px" }}>Trust model</h3>
            <p style={{ margin: 0 }}>
              Non-custodial: funds stay in the user&apos;s MetaMask Smart Account. Every spend is enforced on chain on Base, and the card is revocable at any time. Revoking removes the permission immediately.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--st-111)", margin: "26px 0 8px" }}>Capability model</h3>
            <p style={{ margin: 0 }}>
              A card is a capability primitive. The same permission model can scope any allowlisted on-chain action within limits, so payments are the first of many powers a card can grant.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--st-111)", margin: "26px 0 12px" }}>Roadmap</h3>
            <div style={{ borderTop: "1px solid rgba(var(--st-line-rgb),0.1)" }}>
              {[
                { name: "Pay & subscribe (x402)", status: "Live" },
                { name: "Swap (Uniswap V3)", status: "Live" },
                { name: "Trade", status: "Roadmap" },
                { name: "Predict (Polymarket)", status: "Roadmap" },
                { name: "Yield actions", status: "Roadmap" },
                { name: "NFT bids", status: "Roadmap" },
                { name: "Buy data", status: "Roadmap" },
              ].map((c) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(var(--st-line-rgb),0.1)", fontSize: "14.5px" }}>
                  <span style={{ color: "#1a1a1a" }}>{c.name}</span>
                  <span style={{ color: c.status === "Live" ? "#1FA864" : "var(--st-9b8f7e)", fontWeight: 600 }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" style={{ scrollMarginTop: "90px" }}>
        <div style={{ padding: "110px 40px", maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#E8590C", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>FAQ</span>
            <h2 style={{ fontSize: "clamp(15px, 1.4vw, 16px)", fontWeight: 700, color: "var(--st-111)", letterSpacing: "-0.03em", margin: "12px 0 0" }}>Good to know</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { q: "What exactly is an AgiCard?", a: "A spending card you give to an AI agent. It is backed by a MetaMask Smart Account permission, so a daily cap and an expiry are enforced by the blockchain, with a per charge limit on top." },
              { q: "Do I give the agent my private key?", a: "No. You approve one permission in MetaMask that gives the agent a limited session key. Your private key and seed phrase are never shared, and the agent can only spend within the limits you set." },
              { q: "What can the agent actually pay for?", a: "Sellers it can pay in USDC, like APIs, compute, and data feeds (x402 style pay per use). The agent settles them on its own, but never beyond the card budget." },
              { q: "Which network does this run on?", a: "Base. Every spend is checked on chain against your limits, and each one is saved to 0G storage so you have a clear trail." },
              { q: "Can I stop an agent while it is working?", a: "Yes. Revoking a card removes its permission right away, so the agent can no longer spend the moment you click revoke." },
            ].map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{ background: "rgba(var(--st-glass-rgb),0.7)", border: "1px solid rgba(var(--st-line-rgb),0.07)", borderRadius: "14px", overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "18px 22px", background: "none", border: "none", cursor: "pointer",
                      fontSize: "15px", fontWeight: 600, color: "#1a1a1a", textAlign: "left",
                    }}
                  >
                    {item.q}
                    <ChevronDown size={18} style={{ flexShrink: 0, marginLeft: "14px", color: "var(--st-999)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
                  </button>
                  {open && (
                    <div style={{ padding: "0 22px 20px", fontSize: "14px", color: "var(--st-7c7264)", lineHeight: 1.65 }}>{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "56px 40px 40px" }}>
        <div style={{ width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "28px" }}>
          <div>
            <img src="/AGI-LOGO.jpg" alt="AgiCards" style={{ height: "40px", width: "auto", display: "block", borderRadius: "8px", marginBottom: "12px" }} />
            <p style={{ fontSize: "13px", color: "var(--st-8a7d6c)", margin: 0, maxWidth: "none", whiteSpace: "nowrap", lineHeight: 1.6 }}>
              One permission for agent spending, enforced on chain by MetaMask Smart Accounts.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            {brandRow.map((b) =>
              b.img ? (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <img src={b.img} alt={b.name} style={{ width: "18px", height: "18px", objectFit: "contain", borderRadius: "4px" }} />
                  <span style={{ fontSize: "12px", color: "var(--st-555)", fontWeight: 600 }}>{b.name}</span>
                </div>
              ) : (
                <span key={b.name} style={{ color: "#E8590C", fontSize: "12px", fontWeight: 700 }}>{b.name}</span>
              )
            )}
          </div>
        </div>
        <div style={{ width: "100%", margin: "32px 0 0", paddingTop: "20px", borderTop: "1px solid rgba(var(--st-line-rgb),0.08)", fontSize: "12px", color: "var(--st-a89c8a)" }}>
          © 2026 AgiCards · Built on Base
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(74,222,128,0.8); }
          50% { opacity: 0.6; box-shadow: 0 0 4px rgba(74,222,128,0.4); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(-50%) rotate(-4deg); }
          50% { transform: translateY(calc(-50% - 12px)) rotate(-4deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(-50%) rotate(4deg); }
          50% { transform: translateY(calc(-50% + 12px)) rotate(4deg); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        * { box-sizing: border-box; }
      `}</style>

      {showHow && (
        <div
          onClick={() => setShowHow(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(20,10,5,0.45)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "560px",
              background: "var(--st-fffdfa)", borderRadius: "20px",
              border: "1px solid rgba(var(--st-line-rgb),0.06)",
              boxShadow: "0 30px 80px rgba(var(--st-line-rgb),0.28)",
              padding: "30px 32px", position: "relative",
            }}
          >
            <button
              onClick={() => setShowHow(false)}
              aria-label="Close"
              style={{
                position: "absolute", top: "16px", right: "18px",
                width: "28px", height: "28px", borderRadius: "50%",
                border: "none", background: "rgba(var(--st-line-rgb),0.05)", cursor: "pointer",
                fontSize: "16px", color: "var(--st-666)", lineHeight: 1,
              }}
            >×</button>
            <h2 style={{ fontSize: "23px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>How it works</h2>
            <p style={{ fontSize: "14px", color: "var(--st-999)", margin: "0 0 22px" }}>
              Give an AI agent a spending card with limits the blockchain enforces.
            </p>
            {[
              { n: 1, t: "Describe your card", d: "Say in plain English what the agent can spend. Set a daily cap, a limit per charge, and how long it lasts." },
              { n: 2, t: "Approve once in MetaMask", d: "MetaMask shows those exact limits on a single permission screen. You approve one time." },
              { n: 3, t: "The agent spends", d: "A background agent settles payments in USDC on its own, and only within your limits." },
              { n: 4, t: "Enforced and revocable", d: "Every spend is checked on chain against your limits, and you can revoke the card at any time." },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                <div style={{
                  width: "30px", height: "30px", flexShrink: 0, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                  color: "#1a0a00", fontWeight: 700, fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>{s.t}</div>
                  <div style={{ fontSize: "13.5px", color: "var(--st-777)", lineHeight: 1.55 }}>{s.d}</div>
                </div>
              </div>
            ))}
            <button
              onClick={onLaunchApp}
              style={{
                marginTop: "6px",
                background: "linear-gradient(135deg, #FFE45D, #FFB331, #FF5A12)",
                border: "none", borderRadius: "40px", padding: "12px 26px",
                fontSize: "14px", fontWeight: 700, color: "#1a0a00", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(255,120,20,0.3)",
              }}
            >Launch App ↗</button>
          </div>
        </div>
      )}
    </div>
  );
}
