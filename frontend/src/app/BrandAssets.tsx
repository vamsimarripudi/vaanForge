import React, { useState, useEffect } from "react";
import { motion as rawMotion } from "framer-motion";
import {
  CheckCircle2, Clock, CreditCard, Loader2, Lock,
  Server, ShieldAlert, WifiOff, XCircle, Zap,
  ArrowRight, Search, FileWarning, Ban, Timer,
  Rocket, FileCheck, BadgeCheck, Wrench, X, Eye,
  Sparkles, ShieldCheck, RefreshCw, Globe,
  GitBranch, AlertCircle, Cpu,
} from "lucide-react";

const motion = rawMotion as any;

// ─── Palette ────────────────────────────────────────────────────────────────

const C = {
  bg: "#07090f",
  surface: "#0c1018",
  card: "#0f1520",
  card2: "#111827",
  border: "rgba(255,255,255,0.065)",
  borderAccent: "rgba(0,212,154,0.3)",
  text: "#dce8f8",
  sub: "#7a8da8",
  muted: "#3d4d5f",
  teal: "#00d49a",
  tealDim: "rgba(0,212,154,0.1)",
  tealGlow: "rgba(0,212,154,0.06)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.08)",
  amber: "#fbbf24",
  amberDim: "rgba(251,191,36,0.08)",
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.08)",
  blue: "#60a5fa",
  blueDim: "rgba(96,165,250,0.08)",
};

const F = {
  display: "'Onest', system-ui, sans-serif",
  body: "'Instrument Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── Logo Components ─────────────────────────────────────────────────────────

const VaanForgeMark = ({
  size = 32,
  color = C.teal,
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M5 5L16 26L27 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="26" r="2.5" fill={color} />
    <circle cx="5" cy="5" r="1.5" fill={color} opacity="0.4" />
    <circle cx="27" cy="5" r="1.5" fill={color} opacity="0.4" />
  </svg>
);

const AnimatedMark = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
    <motion.circle cx="5" cy="5" r="1.5" fill={C.teal}
      initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
      transition={{ duration: 0.2, delay: 0.1 }} />
    <motion.circle cx="27" cy="5" r="1.5" fill={C.teal}
      initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
      transition={{ duration: 0.2, delay: 0.1 }} />
    <motion.path
      d="M5 5L16 26L27 5"
      stroke={C.teal}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 }}
    />
    <motion.circle cx="16" cy="26" r="2.5" fill={C.teal}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, delay: 1.3 }} />
  </svg>
);

const FaviconSVG = ({
  size,
  bg = C.teal,
  fg = "#07090f",
  rx,
}: {
  size: number;
  bg?: string;
  fg?: string;
  rx?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx={rx ?? Math.round(size * 0.22)} fill={bg} />
    <path d="M6 6L16 25L26 6" stroke={fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="25" r="2.5" fill={fg} />
  </svg>
);

const Wordmark = ({
  markSize = 20,
  textSize = 18,
  color = C.teal,
}: {
  markSize?: number;
  textSize?: number;
  color?: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, color }}>
    <VaanForgeMark size={markSize} color={color} />
    <span style={{ fontSize: textSize, lineHeight: 1, letterSpacing: "-0.025em", fontFamily: F.display }}>
      <span style={{ fontWeight: 700 }}>Vaan</span>
      <span style={{ fontWeight: 300, opacity: 0.65 }}>Forge</span>
    </span>
  </div>
);

// ─── Shared UI primitives ────────────────────────────────────────────────────

const DotGrid = ({ opacity = 0.35 }: { opacity?: number }) => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: `radial-gradient(circle, rgba(255,255,255,${opacity * 0.25}) 1px, transparent 1px)`,
    backgroundSize: "28px 28px",
  }} />
);

const Shimmer = ({ w = "100%", h = 12, r = 6, style }: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative", ...style }}>
    <motion.div
      style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)" }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ repeat: Infinity, duration: 1.7, ease: "linear" }}
    />
  </div>
);

const BrowserFrame = ({ url, children, height = 300 }: { url: string; children: React.ReactNode; height?: number }) => (
  <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface }}>
    <div style={{ height: 40, background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
      </div>
      <div style={{ flex: 1, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 7, padding: "0 10px" }}>
        <Globe size={10} style={{ color: C.muted }} />
        <span style={{ fontSize: 11, fontFamily: F.mono, color: C.sub }}>{url}</span>
      </div>
      <RefreshCw size={12} style={{ color: C.muted }} />
    </div>
    <div style={{ height, overflow: "hidden", background: C.bg }}>
      {children}
    </div>
  </div>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 10, fontFamily: F.mono, letterSpacing: "0.1em",
    padding: "4px 10px", borderRadius: 100,
    background: C.tealDim, color: C.teal,
    border: "1px solid rgba(0,212,154,0.14)",
    marginBottom: 14,
  }}>
    {children}
  </div>
);

const SectionH = ({ tag, title, sub }: { tag: string; title: string; sub?: string }) => (
  <div style={{ marginBottom: 40 }}>
    <Tag>{tag}</Tag>
    <h2 style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: F.display, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>{title}</h2>
    {sub && <p style={{ fontSize: 15, color: C.sub, fontFamily: F.body, lineHeight: 1.65, maxWidth: 520 }}>{sub}</p>}
  </div>
);

const Card = ({ children, style = {}, onClick, hover = false }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${hov ? C.borderAccent : C.border}`,
        borderRadius: 14,
        padding: 24,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? `0 0 0 1px rgba(0,212,154,0.12), 0 8px 32px rgba(0,0,0,0.4)` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const CardLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.12em", marginBottom: 20, textTransform: "uppercase" }}>{children}</div>
);

// ─── TABS ────────────────────────────────────────────────────────────────────

const TABS = ["Brand", "Favicon & Icons", "Loading", "Error States", "Success", "System Pages", "Collateral"] as const;
type Tab = (typeof TABS)[number];

// ═══════════════════════════════════════════════════════════════════════════
// BRAND TAB
// ═══════════════════════════════════════════════════════════════════════════

function BrandTab({ onSplash }: { onSplash: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>

      {/* ── Logo Hero ────────────────────────────────────────────────── */}
      <section>
        <div style={{
          position: "relative", borderRadius: 20, overflow: "hidden",
          border: `1px solid ${C.border}`,
          background: `radial-gradient(ellipse at 50% 60%, rgba(0,212,154,0.07) 0%, transparent 65%), ${C.surface}`,
          minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <DotGrid opacity={0.5} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "60px 24px" }}>
            <AnimatedMark size={96} />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.55 }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 52, lineHeight: 1, letterSpacing: "-0.03em", fontFamily: F.display, color: C.text }}>
                <span style={{ fontWeight: 800 }}>Vaan</span>
                <span style={{ fontWeight: 200, opacity: 0.5 }}>Forge</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: F.mono, letterSpacing: "0.22em", color: C.teal, opacity: 0.7, textTransform: "uppercase" }}>
                Enterprise AI Software Factory
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              style={{ display: "flex", gap: 8, marginTop: 8 }}
            >
              <button
                onClick={onSplash}
                style={{ fontSize: 12, fontFamily: F.body, padding: "8px 18px", borderRadius: 8, background: C.teal, color: "#07090f", fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Preview Splash →
              </button>
              <div style={{ fontSize: 12, fontFamily: F.mono, padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: C.sub, border: `1px solid ${C.border}` }}>
                v2.0 · Jun 2025
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Mark System ───────────────────────────────────────────────── */}
      <section>
        <SectionH tag="01 / MARK SYSTEM" title="Logo Variants" sub="How the mark and wordmark appear across surfaces, sizes, and color contexts." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {/* Sizes */}
          <Card>
            <CardLabel>Mark — Size Scale</CardLabel>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              {[64, 48, 32, 20, 14].map((s) => (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <VaanForgeMark size={s} />
                  <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted }}>{s}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Wordmark dark */}
          <Card style={{ background: "#07090f", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <CardLabel>Wordmark — Dark</CardLabel>
            <Wordmark markSize={30} textSize={26} color={C.teal} />
          </Card>

          {/* Wordmark light */}
          <Card style={{ background: "#f0f4f9", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: "#5c6878", letterSpacing: "0.12em", marginBottom: 20, textTransform: "uppercase" }}>Wordmark — Light</div>
            <Wordmark markSize={30} textSize={26} color="#007a5e" />
          </Card>

          {/* On primary */}
          <Card style={{ background: C.teal, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: "rgba(7,9,15,0.5)", letterSpacing: "0.12em", marginBottom: 20, textTransform: "uppercase" }}>On Primary</div>
            <Wordmark markSize={30} textSize={26} color="#07090f" />
          </Card>

          {/* Mono white */}
          <Card style={{ background: "#111", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <CardLabel>Monochrome — White</CardLabel>
            <Wordmark markSize={30} textSize={26} color="#fff" />
          </Card>

          {/* Usage rules */}
          <Card>
            <CardLabel>Brand Rules</CardLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { ok: true, rule: 'One word: "VaanForge" — capital V and F' },
                { ok: true, rule: "Keep clear space = one mark height around logo" },
                { ok: false, rule: "Never rotate, stretch, or recolor the mark" },
                { ok: false, rule: "Never use on backgrounds below 3:1 contrast" },
              ].map(({ ok, rule }) => (
                <div key={rule} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  {ok
                    ? <CheckCircle2 size={13} style={{ color: C.teal, flexShrink: 0, marginTop: 1 }} />
                    : <XCircle size={13} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
                  }
                  <span style={{ fontSize: 12, color: C.sub, fontFamily: F.body, lineHeight: 1.5 }}>{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── Color System ───────────────────────────────────────────────── */}
      <section>
        <SectionH tag="02 / COLOR SYSTEM" title="Design Tokens" sub="Token-based palette — primary teal on near-black, with semantic signals for danger, warning, and success." />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primary hero */}
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", padding: "32px 28px", background: `linear-gradient(120deg, #00432f 0%, ${C.teal} 100%)`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: F.mono, letterSpacing: "0.14em", color: "rgba(7,9,15,0.55)", marginBottom: 4 }}>PRIMARY · ENTERPRISE TEAL</div>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: F.display, color: "#07090f", letterSpacing: "-0.02em" }}>#00D49A</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontFamily: F.mono, color: "rgba(7,9,15,0.45)" }}>oklch(0.77 0.16 162)</div>
              <div style={{ fontSize: 12, color: "rgba(7,9,15,0.45)", marginTop: 2 }}>CTAs · links · active states · indicators</div>
            </div>
          </div>

          {/* Semantic grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {[
              { label: "DANGER", hex: "#f87171", bg: "#2d0d0d", usage: "Errors · destructive" },
              { label: "WARNING", hex: "#fbbf24", bg: "#2d200a", usage: "Caution · limits" },
              { label: "SUCCESS", hex: "#34d399", bg: "#092d1d", usage: "Passed · complete" },
              { label: "INFO", hex: "#60a5fa", bg: "#0b1f3a", usage: "Informational" },
              { label: "BACKGROUND", hex: "#0B0E14", bg: C.card2, usage: "App canvas" },
              { label: "SURFACE", hex: "#111621", bg: C.card2, usage: "Cards · panels" },
              { label: "BORDER", hex: "rgba(fff,7%)", bg: C.card2, usage: "Hairline dividers" },
              { label: "MUTED TEXT", hex: "#6B7A94", bg: C.card2, usage: "Labels · captions" },
            ].map(({ label, hex, bg, usage }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: hex, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 10 }} />
                <div style={{ fontSize: 9, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ fontSize: 12, fontFamily: F.mono, color: C.sub, marginTop: 3 }}>{hex}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: F.body, marginTop: 4 }}>{usage}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Typography ─────────────────────────────────────────────────── */}
      <section>
        <SectionH tag="03 / TYPOGRAPHY" title="Type System" sub="Onest for display and UI. Instrument Sans for body copy. JetBrains Mono for code and data tables." />
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          {/* Display */}
          <div style={{ padding: "36px 32px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.12em", marginBottom: 16 }}>DISPLAY — Onest 800, 52px, tracking -0.03em</div>
            <div style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, fontFamily: F.display, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Build Software<br />
              <span style={{ color: C.teal }}>Without Limits.</span>
            </div>
          </div>
          {/* Heading scale */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[
              { label: "H1 — 28px 700", text: "Project Blueprint" },
              { label: "H2 — 20px 600", text: "Build Progress" },
              { label: "H3 — 15px 500", text: "Validation Results" },
            ].map(({ label, text }, i) => (
              <div key={label} style={{ padding: "24px 28px", borderRight: i < 2 ? `1px solid ${C.border}` : "none", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: i === 0 ? 28 : i === 1 ? 20 : 15, fontWeight: i === 0 ? 700 : i === 1 ? 600 : 500, fontFamily: F.display, color: C.text }}>{text}</div>
              </div>
            ))}
          </div>
          {/* Body + mono */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "24px 28px", borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 10 }}>BODY — Instrument Sans 400, 14px, 1.7 leading</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: C.sub, fontFamily: F.body }}>
                VaanForge analyzes your requirements, generates a validated architecture blueprint, and builds all modules with automated QA, security, and deployment checks — without leaving the workspace.
              </p>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 10 }}>MONO — JetBrains Mono 400, 13px</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <code style={{ fontSize: 13, color: C.teal, fontFamily: F.mono }}>POST /api/v1/projects</code>
                <code style={{ fontSize: 12, color: C.sub, fontFamily: F.mono }}>{"{ \"name\": \"EcommerceAPI\", \"plan\": \"pro\" }"}</code>
                <code style={{ fontSize: 11, color: C.muted, fontFamily: F.mono }}>200 OK · 142ms · Build #VF-0847</code>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAVICON & ICONS TAB
// ═══════════════════════════════════════════════════════════════════════════

function FaviconTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
      <SectionH tag="04 / FAVICON & ICONS" title="Icon System" sub="Favicon set, touch icons, PWA assets, and social images — all derived from the VaanForge mark." />

      {/* Browser tab mockup */}
      <div>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>Browser Tab Context</div>
        <div style={{ background: "#1e2029", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "flex-end", padding: "8px 12px 0", gap: 2, background: "#16181f" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1e2029", borderRadius: "8px 8px 0 0", padding: "6px 12px", minWidth: 180, borderTop: `1px solid rgba(255,255,255,0.08)`, borderLeft: `1px solid rgba(255,255,255,0.06)`, borderRight: `1px solid rgba(255,255,255,0.06)` }}>
              <FaviconSVG size={16} rx={3} />
              <span style={{ fontSize: 12, color: C.text, fontFamily: F.body }}>VaanForge — Workspace</span>
              <X size={11} style={{ color: C.muted, marginLeft: "auto" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", borderRadius: "8px 8px 0 0", padding: "6px 12px", opacity: 0.45 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: C.muted, opacity: 0.4 }} />
              <span style={{ fontSize: 12, color: C.sub, fontFamily: F.body }}>New tab</span>
            </div>
          </div>
          {/* URL bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7, padding: "0 12px" }}>
              <Globe size={11} style={{ color: C.muted }} />
              <span style={{ fontSize: 12, fontFamily: F.mono, color: C.sub }}>app.vaanforge.io</span>
              <div style={{ marginLeft: "auto", fontSize: 10, fontFamily: F.mono, color: C.teal, background: C.tealDim, padding: "1px 6px", borderRadius: 4 }}>🔒 Secure</div>
            </div>
          </div>
          {/* Content stub */}
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wordmark markSize={18} textSize={16} />
          </div>
        </div>
      </div>

      {/* Favicon sizes */}
      <div>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>Favicon Sizes — Dark Primary</div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, display: "flex", alignItems: "flex-end", gap: 28, flexWrap: "wrap" }}>
          {[{ s: 64, label: "64×64" }, { s: 48, label: "48×48" }, { s: 32, label: "32×32" }, { s: 24, label: "24×24" }, { s: 16, label: "16×16" }].map(({ s, label }) => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <FaviconSVG size={s} />
              <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* App icon + touch icon grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {/* App icon */}
        <Card>
          <CardLabel>App Icon — 512×512</CardLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <FaviconSVG size={80} rx={18} />
            <div>
              <div style={{ fontSize: 12, color: C.sub, fontFamily: F.body, lineHeight: 1.7 }}>
                <div>Format: PNG / WebP</div>
                <div>Size: 512 × 512 px</div>
                <div>Radius: ~20% (auto on iOS)</div>
                <code style={{ fontSize: 11, color: C.teal, fontFamily: F.mono }}>icon-512.png</code>
              </div>
            </div>
          </div>
        </Card>

        {/* Apple touch */}
        <Card>
          <CardLabel>Apple Touch Icon — 180×180</CardLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <FaviconSVG size={64} rx={16} />
            <div style={{ fontSize: 12, color: C.sub, fontFamily: F.body, lineHeight: 1.7 }}>
              <div>Format: PNG</div>
              <div>Size: 180 × 180 px</div>
              <div>OS clips radius automatically</div>
              <code style={{ fontSize: 11, color: C.teal, fontFamily: F.mono }}>apple-touch-icon.png</code>
            </div>
          </div>
        </Card>

        {/* Inverted favicon */}
        <Card>
          <CardLabel>Light Mode / Inverted Variant</CardLabel>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            {[48, 32, 16].map((s) => (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <FaviconSVG size={s} bg="#007a5e" fg="#ffffff" />
                <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted }}>{s}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.sub, fontFamily: F.body, lineHeight: 1.6, marginLeft: 4 }}>
              For light OS themes<br />and media queries
            </div>
          </div>
        </Card>

        {/* OG image */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <CardLabel>Social / OG Image — 1200×630</CardLabel>
          </div>
          <div style={{ background: `linear-gradient(135deg, #07090f 55%, #0d2e24 100%)`, padding: "24px 28px", display: "flex", alignItems: "center", gap: 14, minHeight: 90 }}>
            <VaanForgeMark size={36} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display }}>VaanForge</div>
              <div style={{ fontSize: 12, color: C.sub, fontFamily: F.body, marginTop: 2 }}>Enterprise AI Software Factory</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, fontFamily: F.mono, color: C.muted }}>1200 × 630</div>
          </div>
        </Card>
      </div>

      {/* Splash preview */}
      <div>
        <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>Splash Screen — Full-screen launch experience</div>
        <SplashPreviewCard />
      </div>
    </div>
  );
}

function SplashPreviewCard() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 1.2)), 50);
    return () => clearInterval(t);
  }, []);
  const stages = ["Connecting workspace", "Loading context", "Initializing AI runtime", "Ready"];
  const stageIdx = p < 25 ? 0 : p < 55 ? 1 : p < 85 ? 2 : 3;
  return (
    <div style={{ background: "#07090f", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, position: "relative" }}>
        <DotGrid opacity={0.4} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,212,154,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
            <VaanForgeMark size={56} />
          </motion.div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontFamily: F.display, color: C.text, letterSpacing: "-0.02em" }}>
              <span style={{ fontWeight: 700 }}>Vaan</span>
              <span style={{ fontWeight: 200, opacity: 0.5 }}>Forge</span>
            </div>
            <div style={{ fontSize: 10, fontFamily: F.mono, letterSpacing: "0.2em", color: C.teal, opacity: 0.6, marginTop: 4 }}>ENTERPRISE AI SOFTWARE FACTORY</div>
          </div>
          <div style={{ width: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.sub, fontFamily: F.body }}>{stages[stageIdx]}</span>
              <span style={{ fontSize: 11, fontFamily: F.mono, color: C.teal }}>{Math.round(p)}%</span>
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div style={{ height: "100%", background: C.teal, borderRadius: 2, width: `${p}%` }} transition={{ duration: 0.05 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATES TAB
// ═══════════════════════════════════════════════════════════════════════════

function LoadingTab() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 1.5)), 60);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      <SectionH tag="05 / LOADING STATES" title="Every Async State" sub="All loading patterns — live and animated in their real UI context, not isolated demos." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>

        {/* Spinner variants */}
        <Card>
          <CardLabel>Spinner — 3 Sizes</CardLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {[{ s: 12, label: "sm" }, { s: 20, label: "md" }, { s: 32, label: "lg" }].map(({ s, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <Loader2 size={s} style={{ color: C.teal }} />
                </motion.div>
                <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 8 }}>
              <button style={{ fontSize: 12, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.sub, display: "flex", alignItems: "center", gap: 6, cursor: "default", fontFamily: F.body }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <Loader2 size={12} style={{ color: C.teal }} />
                </motion.div>
                Submitting…
              </button>
            </div>
          </div>
        </Card>

        {/* Agent typing */}
        <Card>
          <CardLabel>Agent Typing Indicator</CardLabel>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: C.tealDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VaanForgeMark size={12} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.text, fontFamily: F.display }}>VaanForge Agent</span>
              <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, marginLeft: "auto" }}>generating…</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div key={delay} style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay, ease: "easeInOut" }} />
              ))}
              <span style={{ fontSize: 12, color: C.muted, fontFamily: F.body, marginLeft: 6 }}>Analyzing requirements…</span>
            </div>
          </div>
        </Card>

        {/* Build progress */}
        <Card>
          <CardLabel>Build Progress — Deterministic</CardLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.sub, fontFamily: F.body }}>Building module {Math.ceil(progress / 10)} of 10</span>
              <span style={{ color: C.teal, fontFamily: F.mono }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <motion.div style={{ height: "100%", background: `linear-gradient(90deg, #00845a, ${C.teal})`, borderRadius: 4, width: `${progress}%` }} transition={{ duration: 0.06 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Loader2 size={11} style={{ color: C.muted }} />
              </motion.div>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: F.body }}>
                {progress < 30 ? "Compiling auth module…" : progress < 60 ? "Running type checks…" : progress < 85 ? "Security validation…" : "Finalizing build…"}
              </span>
            </div>
          </div>
        </Card>

        {/* Agent stream */}
        <Card>
          <CardLabel>Agent Response — Streaming</CardLabel>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ fontSize: 13, color: C.sub, fontFamily: F.body, lineHeight: 1.65 }}>
              {"I've analyzed your requirements. Your project needs a REST API with JWT authentication, a PostgreSQL schema, and a React frontend."}
              <motion.span
                style={{ display: "inline-block", width: 2, height: 14, background: C.teal, marginLeft: 2, verticalAlign: "middle", borderRadius: 1 }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
              />
            </p>
          </div>
        </Card>

        {/* Card skeleton */}
        <Card>
          <CardLabel>Card Skeleton</CardLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Shimmer w={36} h={36} r={8} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Shimmer w="70%" h={11} />
                <Shimmer w="45%" h={9} />
              </div>
            </div>
            <Shimmer h={10} />
            <Shimmer w="80%" h={10} />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Shimmer w={72} h={28} r={8} />
              <Shimmer w={56} h={28} r={8} />
            </div>
          </div>
        </Card>

        {/* Table skeleton */}
        <Card>
          <CardLabel>Table Row Skeletons</CardLabel>
          <div>
            <div style={{ display: "flex", gap: 16, paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
              <Shimmer w={80} h={9} />
              <Shimmer w={120} h={9} />
              <Shimmer w={60} h={9} style={{ marginLeft: "auto" }} />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                <Shimmer w={64} h={9} />
                <Shimmer w={100} h={9} />
                <Shimmer w={48} h={9} style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </Card>

        {/* Full workspace skeleton */}
        <Card style={{ gridColumn: "span 2" }}>
          <CardLabel>Full Workspace Skeleton — Initial Load</CardLabel>
          <div style={{ display: "flex", gap: 16 }}>
            {/* Sidebar */}
            <div style={{ width: 140, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, borderRight: `1px solid ${C.border}`, paddingRight: 14 }}>
              <Shimmer w="100%" h={28} r={8} />
              <Shimmer w={60} h={8} style={{ marginTop: 8 }} />
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} w="100%" h={24} r={6} />
              ))}
            </div>
            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Shimmer w={140} h={28} r={8} />
                <Shimmer w={80} h={28} r={8} style={{ marginLeft: "auto" }} />
              </div>
              <Shimmer h={64} r={10} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Shimmer h={48} r={8} />
                <Shimmer h={48} r={8} />
                <Shimmer h={48} r={8} />
              </div>
              <Shimmer h={10} />
              <Shimmer w="75%" h={10} />
            </div>
          </div>
        </Card>

        {/* Overlay loader */}
        <Card>
          <CardLabel>Overlay / Blocking Loader</CardLabel>
          <div style={{ position: "relative", height: 100, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(7,9,15,0.7)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}>
                <Loader2 size={24} style={{ color: C.teal }} />
              </motion.div>
              <span style={{ fontSize: 12, color: C.sub, fontFamily: F.body }}>Generating blueprint…</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATES TAB
// ═══════════════════════════════════════════════════════════════════════════

const ERRORS = [
  { icon: Server, color: C.red, dim: "rgba(248,113,113,0.07)", code: "503", title: "API Unavailable", desc: "The VaanForge API is temporarily offline. Our team has been notified and is investigating.", actions: ["Check Status Page", "Try Again"], border: "#f87171" },
  { icon: Lock, color: C.amber, dim: "rgba(251,191,36,0.07)", code: "403", title: "Permission Denied", desc: "You don't have access to this resource. Contact your workspace admin to request the correct role.", actions: ["Request Access", "Switch Account"], border: "#fbbf24" },
  { icon: CreditCard, color: "#fb923c", dim: "rgba(251,146,60,0.07)", code: "402", title: "Plan Limit Reached", desc: "You've hit the project limit on your current plan. Upgrade to continue creating new projects.", actions: ["Upgrade Plan", "Archive Project"], border: "#fb923c" },
  { icon: AlertCircle, color: C.red, dim: C.redDim, code: "BILLING", title: "Payment Failed", desc: "Your last payment was declined. Update your payment method to restore full workspace access.", actions: ["Update Payment", "Contact Billing"], border: "#f87171" },
  { icon: FileWarning, color: C.amber, dim: C.amberDim, code: "QA FAIL", title: "Validation Failed", desc: "Automated QA found 3 critical issues that must be resolved before this build can proceed.", actions: ["View Report", "Re-run Checks"], border: "#fbbf24" },
  { icon: Ban, color: "#fb923c", dim: "rgba(251,146,60,0.07)", code: "BLOCKED", title: "Build Blocked", desc: "This build is blocked — the blueprint hasn't been approved yet. Review and approve to continue.", actions: ["Review Blueprint", "Request Changes"], border: "#fb923c" },
  { icon: ShieldAlert, color: C.red, dim: C.redDim, code: "SEC FAIL", title: "Deployment Blocked", desc: "A security gate failed — exposed credentials were detected in the output. Fix before deploying.", actions: ["Security Report", "Re-run Clean"], border: "#f87171" },
  { icon: Timer, color: C.muted, dim: "rgba(255,255,255,0.04)", code: "401", title: "Session Expired", desc: "Your session expired for security. Sign in again — your workspace and data are safe.", actions: ["Sign In Again", "Go Home"], border: "rgba(255,255,255,0.12)" },
];

function ErrorTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      <SectionH tag="06 / ERROR STATES" title="Every Failure Mode" sub="Each error includes the exact reason, a recovery action, and a next step. No dead ends." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {ERRORS.map((e) => {
          const Icon = e.icon;
          return (
            <div key={e.code} style={{
              background: e.dim,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${e.border}`,
              borderRadius: 14,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: e.color }} />
                </div>
                <div style={{ fontSize: 10, fontFamily: F.mono, color: e.color, background: `${e.color}18`, padding: "3px 8px", borderRadius: 100, letterSpacing: "0.08em" }}>{e.code}</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: F.display }}>{e.title}</div>
                <p style={{ fontSize: 12, color: C.sub, fontFamily: F.body, lineHeight: 1.65, marginTop: 6 }}>{e.desc}</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button style={{ flex: 1, fontSize: 12, padding: "7px 12px", borderRadius: 8, background: e.color, color: "#07090f", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: F.body }}>
                  {e.actions[0]}
                </button>
                <button style={{ flex: 1, fontSize: 12, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: C.sub, border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: F.body }}>
                  {e.actions[1]}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS STATES TAB
// ═══════════════════════════════════════════════════════════════════════════

const SUCCESSES = [
  { icon: Sparkles, title: "Project Created", sub: "Project ID: VF-2025-0847", detail: "VaanForge is ready to analyze your requirements.", cta: "Start Requirements" },
  { icon: FileCheck, title: "Blueprint Approved", sub: "16 modules · 4 APIs · 1 database", detail: "VaanForge will now generate the full task graph.", cta: "View Task Graph" },
  { icon: Cpu, title: "Build Complete", sub: "12 / 12 tasks · 0 errors · 2m 38s", detail: "All modules compiled and tested. Output is ready.", cta: "Review Output" },
  { icon: Rocket, title: "Deployment Live", sub: "app.vaanforge.io/deploy/vf-0847", detail: "Your project is now live. Monitor from Deployments.", cta: "Open Deployment" },
  { icon: BadgeCheck, title: "Payment Confirmed", sub: "Plan: Professional · Next: Jan 1, 2026", detail: "All Professional features are now active.", cta: "View Billing" },
  { icon: ShieldCheck, title: "Validation Passed", sub: "64 checks · 0 warnings · 0 failures", detail: "Security, QA, and deployment readiness confirmed.", cta: "View Report" },
];

function SuccessTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      <SectionH tag="07 / SUCCESS STATES" title="Confirmations" sub="Each success is specific, informative, and action-oriented — never generic." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {SUCCESSES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} style={{
              background: "rgba(52,211,153,0.04)",
              border: `1px solid rgba(52,211,153,0.12)`,
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)" }} />
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <Icon size={20} style={{ color: C.green }} />
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.3 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: C.green, background: "rgba(52,211,153,0.1)", padding: "4px 10px", borderRadius: 100 }}
                >
                  <CheckCircle2 size={11} />
                  Complete
                </motion.div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: F.display }}>{s.title}</div>
                <div style={{ fontSize: 11, fontFamily: F.mono, color: C.green, marginTop: 4, opacity: 0.8 }}>{s.sub}</div>
                <p style={{ fontSize: 12, color: C.sub, fontFamily: F.body, lineHeight: 1.65, marginTop: 6 }}>{s.detail}</p>
              </div>
              <button style={{ fontSize: 12, padding: "8px 0", borderRadius: 10, background: C.green, color: "#07090f", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {s.cta} <ArrowRight size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PAGES TAB
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PAGES: {
  id: string; url: string; label: string; icon: React.ElementType;
  color: string; desc: string;
}[] = [
  { id: "404", url: "app.vaanforge.io/workspace", label: "404 — Not Found", icon: Search, color: C.sub, desc: "Page or resource does not exist" },
  { id: "403", url: "app.vaanforge.io/settings/billing", label: "403 — Access Denied", icon: Lock, color: C.amber, desc: "User lacks permission" },
  { id: "500", url: "app.vaanforge.io/builds/vf-0847", label: "500 — Server Error", icon: Server, color: C.red, desc: "Unexpected server-side failure" },
  { id: "503", url: "app.vaanforge.io", label: "503 — Service Unavailable", icon: WifiOff, color: C.red, desc: "Service temporarily offline" },
  { id: "429", url: "api.vaanforge.io/v1/projects", label: "429 — Rate Limited", icon: Timer, color: "#fb923c", desc: "Too many requests" },
  { id: "session", url: "app.vaanforge.io/workspace", label: "Session Expired", icon: Clock, color: C.sub, desc: "Authentication token expired" },
  { id: "plan", url: "app.vaanforge.io/projects/new", label: "Plan Limit", icon: Zap, color: C.amber, desc: "Feature unavailable on plan" },
  { id: "maintenance", url: "app.vaanforge.io", label: "Maintenance Mode", icon: Wrench, color: C.blue, desc: "Scheduled downtime" },
  { id: "build-404", url: "app.vaanforge.io/builds/vf-xxxx", label: "Build Not Found", icon: GitBranch, color: C.sub, desc: "Build ID has no record" },
];

function SystemPageInner({ id }: { id: string }) {
  const pages: Record<string, { code: string; icon: React.ElementType; color: string; title: string; body: string; actions: string[]; extra?: React.ReactNode }> = {
    "404": { code: "404", icon: Search, color: C.sub, title: "Page Not Found", body: "The page you're looking for doesn't exist or may have been moved. Check the URL or go back to your workspace.", actions: ["Go to Workspace", "Search Docs"] },
    "403": { code: "403", icon: Lock, color: C.amber, title: "Access Denied", body: "You don't have permission to view this page. This resource may be restricted to certain roles or plan levels.", actions: ["Request Access", "Contact Admin"] },
    "500": { code: "500", icon: Server, color: C.red, title: "Internal Server Error", body: "Something went wrong on our end. Our engineering team has been automatically notified. Try refreshing in a moment.", actions: ["Refresh Page", "Check Status"] },
    "503": { code: "503", icon: WifiOff, color: C.red, title: "Service Unavailable", body: "VaanForge is temporarily offline due to a service interruption. We're working to restore access.", actions: ["Check Status", "Contact Support"] },
    "429": { code: "429", icon: Timer, color: "#fb923c", title: "Rate Limit Reached", body: "You've sent too many requests in a short window. Your limit resets automatically — or upgrade for higher limits.", actions: ["View Plan Limits", "Retry in 60s"] },
    "session": { code: "401", icon: Clock, color: C.sub, title: "Session Expired", body: "Your session expired for security. Sign in again to continue — your workspace and project data are safe.", actions: ["Sign In Again", "Go to Home"] },
    "plan": { code: "402", icon: Zap, color: C.amber, title: "Plan Limit Reached", body: "You've hit the project limit on your current plan. Upgrade to Professional or higher to create unlimited projects.", actions: ["Upgrade Plan", "Archive Project"] },
    "maintenance": { code: "—", icon: Wrench, color: C.blue, title: "Scheduled Maintenance", body: "VaanForge is undergoing scheduled maintenance to improve reliability. We'll be back shortly.", actions: ["Check Status", "Contact Support"] },
    "build-404": { code: "404", icon: GitBranch, color: C.sub, title: "Build Not Found", body: "The build you're looking for doesn't exist or you may not have access to it. Check the ID or return to your project.", actions: ["Back to Project", "View All Builds"] },
  };
  const p = pages[id];
  if (!p) return null;
  const Icon = p.icon;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, padding: 32, textAlign: "center", gap: 18, background: C.bg }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={26} style={{ color: p.color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontFamily: F.mono, color: C.muted, marginBottom: 6 }}>{p.code}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: F.display, marginBottom: 8 }}>{p.title}</div>
        <p style={{ fontSize: 13, color: C.sub, fontFamily: F.body, lineHeight: 1.65, maxWidth: 380 }}>{p.body}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {p.actions.map((a, i) => (
          <button key={a} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8, background: i === 0 ? C.teal : "rgba(255,255,255,0.05)", color: i === 0 ? "#07090f" : C.sub, fontWeight: i === 0 ? 600 : 400, border: i === 0 ? "none" : `1px solid ${C.border}`, cursor: "pointer", fontFamily: F.body }}>
            {a}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted, marginTop: 4, fontFamily: F.body }}>
        <VaanForgeMark size={10} color={C.teal} />
        VaanForge · <span style={{ color: C.teal, cursor: "pointer" }}>Support</span> · <span style={{ color: C.teal, cursor: "pointer" }}>Status</span>
      </div>
    </div>
  );
}

function SystemPageCard({ page, onView }: { page: typeof SYSTEM_PAGES[0]; onView: (id: string) => void }) {
  const [hov, setHov] = useState(false);
  const Icon = page.icon;
  return (
    <div onClick={() => onView(page.id)} style={{ cursor: "pointer" }}>
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <BrowserFrame url={page.url} height={220}>
          <SystemPageInner id={page.id} />
        </BrowserFrame>
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: hov ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 500, color: "#fff", background: "rgba(255,255,255,0.13)", padding: "8px 18px", borderRadius: 100, backdropFilter: "blur(8px)", opacity: hov ? 1 : 0, transition: "opacity 0.2s" }}>
            <Eye size={13} /> Full Preview
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={13} style={{ color: page.color }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: F.display }}>{page.label}</span>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: F.body }}>{page.desc}</span>
      </div>
    </div>
  );
}

function SystemPagesTab({ onView }: { onView: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      <SectionH tag="08 / SYSTEM PAGES" title="Full-Page States" sub="Every edge case has a full-page experience — shown in browser context. Click any to see the full preview." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        {SYSTEM_PAGES.map((page) => (
          <SystemPageCard key={page.id} page={page} onView={onView} />
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════

function SplashScreen({ onClose }: { onClose: () => void }) {
  const [p, setP] = useState(0);
  const stages = ["Connecting workspace", "Loading project context", "Initializing AI runtime", "Restoring session", "Ready"];
  useEffect(() => {
    const t = setInterval(() => {
      setP((v) => {
        if (v >= 100) { clearInterval(t); setTimeout(onClose, 700); return 100; }
        return v + Math.random() * 3 + 0.8;
      });
    }, 55);
    return () => clearInterval(t);
  }, [onClose]);
  const si = p < 20 ? 0 : p < 45 ? 1 : p < 70 ? 2 : p < 90 ? 3 : 4;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#07090f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <DotGrid opacity={0.45} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,212,154,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: 280 }} onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <AnimatedMark size={72} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontSize: 36, fontFamily: F.display, color: C.text, letterSpacing: "-0.025em" }}>
            <span style={{ fontWeight: 800 }}>Vaan</span>
            <span style={{ fontWeight: 200, opacity: 0.5 }}>Forge</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: F.mono, letterSpacing: "0.2em", color: C.teal, opacity: 0.65, marginTop: 6, textTransform: "uppercase" }}>
            Enterprise AI Software Factory
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          style={{ width: "100%" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.sub, fontFamily: F.body }}>{stages[si]}</span>
            <span style={{ fontSize: 12, fontFamily: F.mono, color: C.teal }}>{Math.round(Math.min(p, 100))}%</span>
          </div>
          <div style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: `linear-gradient(90deg, #00845a, ${C.teal})`, borderRadius: 2, width: `${Math.min(p, 100)}%` }} transition={{ duration: 0.06 }} />
          </div>
          <button onClick={onClose} style={{ marginTop: 24, fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: F.body, display: "block", marginInline: "auto" }}>
            Skip →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SystemPageModal({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const page = SYSTEM_PAGES.find((p) => p.id === id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 720, borderRadius: 18, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}
      >
        {/* Modal nav bar */}
        <div style={{ height: 46, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wordmark markSize={14} textSize={13} />
            <span style={{ fontSize: 11, color: C.muted, fontFamily: F.mono }}>· {page?.label}</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={13} style={{ color: C.sub }} />
          </button>
        </div>
        {/* Browser chrome */}
        <div style={{ height: 40, background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
          </div>
          <div style={{ flex: 1, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7, padding: "0 10px" }}>
            <Globe size={10} style={{ color: C.muted }} />
            <span style={{ fontSize: 11, fontFamily: F.mono, color: C.sub }}>{page?.url}</span>
          </div>
        </div>
        {/* Full page content */}
        <SystemPageInner id={id} />
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLATERAL TAB — Email · Social · Letter headers
// ═══════════════════════════════════════════════════════════════════════════

const CO = {
  name: "VaanForge",
  legal: "Vaan Technologies Pvt. Ltd.",
  tagline: "Enterprise AI Software Factory",
  email: "hello@vaanforge.io",
  support: "support@vaanforge.io",
  web: "vaanforge.io",
  address: "Koramangala, Bengaluru — 560 034, Karnataka, India",
  cin: "U72900KA2024PTC123456",
  gstin: "29AABCV1234A1Z5",
  phone: "+91 80 4567 8900",
};

/* ── Shared label chip ────────────────────────────────────────────────── */
const DimLabel = ({ w, h, label }: { w: string; h: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    <span style={{ fontSize: 10, fontFamily: F.mono, color: C.muted }}>{w} × {h}</span>
  </div>
);

/* ── Email client chrome wrapper ──────────────────────────────────────── */
const EmailChrome = ({ children }: { children: React.ReactNode }) => (
  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: "#1a1d27" }}>
    {/* Title bar */}
    <div style={{ height: 36, background: "#13151e", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
      </div>
      <div style={{ fontSize: 11, fontFamily: F.mono, color: C.muted }}>New Message — VaanForge</div>
    </div>
    {/* Email meta */}
    <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 4 }}>
      {[["From", `VaanForge <${CO.email}>`], ["To", "recipient@company.com"], ["Subject", "Your VaanForge Workspace Update"]].map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: F.body }}>
          <span style={{ color: C.muted, width: 44, flexShrink: 0 }}>{k}</span>
          <span style={{ color: C.sub }}>{v}</span>
        </div>
      ))}
    </div>
    {/* Email body */}
    <div style={{ background: "#f5f7fa" }}>{children}</div>
  </div>
);

/* ── Document paper wrapper ───────────────────────────────────────────── */
const Paper = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#ffffff", border: `1px solid rgba(0,0,0,0.1)`,
    borderRadius: 8, overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
    ...style,
  }}>
    {children}
  </div>
);

function CollateralTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 72 }}>
      <SectionH
        tag="09 / COLLATERAL"
        title="Email, Social & Letter Headers"
        sub={`All branded communication assets for VaanForge by ${CO.legal} — ready for production use.`}
      />

      {/* ═══ EMAIL HEADERS ═══════════════════════════════════════════════════ */}
      <section>
        <div style={{ fontSize: 12, fontFamily: F.mono, color: C.sub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28 }}>Email Headers</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 1 — Marketing / Newsletter */}
          <div>
            <DimLabel w="600px" h="120px" label="Marketing / Newsletter Header" />
            <EmailChrome>
              {/* The actual email header design — light email bg */}
              <div style={{ fontFamily: F.display }}>
                {/* Top teal accent bar */}
                <div style={{ height: 4, background: `linear-gradient(90deg, #007a5e 0%, #00d49a 100%)` }} />
                {/* Header band */}
                <div style={{ background: "#0b0e14", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <VaanForgeMark size={28} color="#00d49a" />
                    <div>
                      <div style={{ fontSize: 18, color: "#f0f4fa", letterSpacing: "-0.02em" }}>
                        <span style={{ fontWeight: 700 }}>Vaan</span>
                        <span style={{ fontWeight: 200, opacity: 0.6 }}>Forge</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#00d49a", opacity: 0.75, fontFamily: F.mono, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 1 }}>
                        {CO.tagline}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: F.body }}>{CO.legal}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: F.mono, marginTop: 2 }}>{CO.web}</div>
                  </div>
                </div>
                {/* Nav strip */}
                <div style={{ background: "#111621", padding: "0 32px", display: "flex", gap: 20, borderBottom: "2px solid #00d49a" }}>
                  {["Workspace", "Builds", "Pricing", "Docs", "Help"].map(l => (
                    <a key={l} style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: F.body, padding: "10px 0", textDecoration: "none", display: "block" }}>{l}</a>
                  ))}
                </div>
              </div>
            </EmailChrome>
          </div>

          {/* 2 — Transactional (light) */}
          <div>
            <DimLabel w="600px" h="80px" label="Transactional / Notification Header — Light" />
            <EmailChrome>
              <div style={{ background: "#ffffff", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e8ecf2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <VaanForgeMark size={20} color="#007a5e" />
                  <span style={{ fontSize: 15, fontFamily: F.display, letterSpacing: "-0.02em", color: "#0d1117" }}>
                    <span style={{ fontWeight: 700 }}>Vaan</span><span style={{ fontWeight: 300, opacity: 0.55 }}>Forge</span>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, fontFamily: F.body, color: "#5c6878" }}>{CO.legal}</div>
                  <div style={{ fontSize: 9, fontFamily: F.mono, color: "#007a5e", marginTop: 1 }}>{CO.web}</div>
                </div>
              </div>
              {/* Preview body */}
              <div style={{ padding: "24px 32px 20px", background: "#f5f7fa" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0d1117", fontFamily: F.display, marginBottom: 6 }}>Your blueprint is ready for review</div>
                <div style={{ fontSize: 12, color: "#5c6878", fontFamily: F.body, lineHeight: 1.6 }}>
                  EcommerceAPI v1 has generated a 16-module architecture blueprint. Review and approve it to begin the build.
                </div>
                <div style={{ marginTop: 16 }}>
                  <a style={{ fontSize: 12, padding: "8px 18px", borderRadius: 8, background: "#007a5e", color: "#fff", fontFamily: F.body, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                    Review Blueprint →
                  </a>
                </div>
              </div>
            </EmailChrome>
          </div>

          {/* 3 — Email Signature */}
          <div>
            <DimLabel w="480px" h="90px" label="Email Signature Footer" />
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: "#1a1d27" }}>
              <div style={{ height: 32, background: "#13151e", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
              </div>
              <div style={{ background: "#ffffff", padding: "16px 24px" }}>
                {/* Divider */}
                <div style={{ height: 1, background: "#e8ecf2", marginBottom: 14 }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Logo column */}
                  <div style={{ borderRight: "2px solid #00d49a", paddingRight: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <VaanForgeMark size={24} color="#007a5e" />
                    <div style={{ fontSize: 8, fontFamily: F.mono, color: "#007a5e", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>VAANFORGE</div>
                  </div>
                  {/* Details column */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0d1117", fontFamily: F.display }}>Arjun Sharma</div>
                    <div style={{ fontSize: 11, color: "#5c6878", fontFamily: F.body }}>Senior Product Manager · VaanForge</div>
                    <div style={{ fontSize: 10, color: "#5c6878", fontFamily: F.body, marginTop: 4, lineHeight: 1.7 }}>
                      <span style={{ color: "#007a5e" }}>{CO.email}</span>
                      {" · "}{CO.phone}<br />
                      <span style={{ fontSize: 9 }}>{CO.legal} · {CO.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ SOCIAL MEDIA HEADERS ═══════════════════════════════════════════ */}
      <section>
        <div style={{ fontSize: 12, fontFamily: F.mono, color: C.sub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28 }}>Social Media Headers</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Twitter / X Cover — 1500×500 (3:1) */}
          <div>
            <DimLabel w="1500px" h="500px" label="Twitter / X — Cover Photo" />
            <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, position: "relative", aspectRatio: "3/1", background: `radial-gradient(ellipse at 30% 60%, rgba(0,212,154,0.12) 0%, transparent 60%), linear-gradient(135deg, #07090f 0%, #0d2e24 100%)` }}>
              <DotGrid opacity={0.4} />
              {/* Diagonal accent strip */}
              <div style={{ position: "absolute", top: 0, right: 0, width: "35%", height: "100%", background: "linear-gradient(135deg, transparent 40%, rgba(0,212,154,0.06) 100%)" }} />
              <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 6%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <VaanForgeMark size={52} color="#00d49a" />
                    <div>
                      <div style={{ fontSize: "clamp(24px,4vw,36px)", fontFamily: F.display, color: "#f0f4fa", letterSpacing: "-0.03em", lineHeight: 1 }}>
                        <span style={{ fontWeight: 800 }}>Vaan</span>
                        <span style={{ fontWeight: 200, opacity: 0.5 }}>Forge</span>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: F.mono, color: "#00d49a", opacity: 0.7, letterSpacing: "0.18em", marginTop: 5, textTransform: "uppercase" }}>
                        {CO.tagline}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: F.body, color: "rgba(220,232,248,0.5)" }}>
                    {CO.legal} · {CO.web}
                  </div>
                </div>
                {/* Right side: pill tags */}
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  {["AI-Powered Builds", "Human Approval", "Enterprise Ready"].map(tag => (
                    <div key={tag} style={{ fontSize: 11, fontFamily: F.body, color: "#00d49a", background: "rgba(0,212,154,0.1)", border: "1px solid rgba(0,212,154,0.2)", padding: "5px 12px", borderRadius: 100 }}>{tag}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Company Banner — 1128×191 (~6:1) */}
          <div>
            <DimLabel w="1128px" h="191px" label="LinkedIn — Company Page Banner" />
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "1128/191", background: `linear-gradient(110deg, #0b0e14 0%, #0d2e24 60%, #07090f 100%)`, display: "flex", alignItems: "center", padding: "0 5%", position: "relative" }}>
              <DotGrid opacity={0.35} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: C.teal }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <VaanForgeMark size={40} color="#00d49a" />
                  <div>
                    <div style={{ fontSize: 22, fontFamily: F.display, color: "#f0f4fa", fontWeight: 700, letterSpacing: "-0.02em" }}>VaanForge</div>
                    <div style={{ fontSize: 10, fontFamily: F.mono, color: "#00d49a", opacity: 0.7, letterSpacing: "0.15em", marginTop: 3, textTransform: "uppercase" }}>{CO.tagline}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, fontFamily: F.body, color: "rgba(255,255,255,0.4)" }}>{CO.legal}</div>
                  <div style={{ fontSize: 10, fontFamily: F.mono, color: "rgba(0,212,154,0.6)", marginTop: 3 }}>{CO.web}</div>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Personal Header — 1584×396 (4:1) */}
          <div>
            <DimLabel w="1584px" h="396px" label="LinkedIn — Personal Background Photo" />
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "4/1", position: "relative", background: `radial-gradient(ellipse at 20% 80%, rgba(0,212,154,0.1) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.06) 0%, transparent 50%), ${C.bg}` }}>
              <DotGrid opacity={0.5} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.teal} 0%, transparent 100%)` }} />
              <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <VaanForgeMark size={36} color="#00d49a" />
                  <div style={{ fontSize: 24, fontFamily: F.display, color: C.text, letterSpacing: "-0.025em" }}>
                    <span style={{ fontWeight: 700 }}>Vaan</span><span style={{ fontWeight: 200, opacity: 0.5 }}>Forge</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: F.mono, color: C.teal, opacity: 0.65, letterSpacing: "0.2em", textTransform: "uppercase" }}>{CO.tagline}</div>
                <div style={{ fontSize: 10, fontFamily: F.body, color: C.muted }}>{CO.legal}</div>
              </div>
            </div>
          </div>

          {/* YouTube Channel Art — 2560×1440 (16:9) */}
          <div>
            <DimLabel w="2560px" h="1440px" label="YouTube — Channel Art (16:9)" />
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "16/9", maxHeight: 280, position: "relative", background: `linear-gradient(135deg, #07090f 0%, #0c1f18 50%, #07090f 100%)` }}>
              <DotGrid opacity={0.45} />
              {/* Teal grid lines */}
              <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,212,154,0.03) 39px, rgba(0,212,154,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,212,154,0.03) 39px, rgba(0,212,154,0.03) 40px)` }} />
              {/* Glow */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,212,154,0.08) 0%, transparent 60%)" }} />
              <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <VaanForgeMark size={56} color="#00d49a" />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(20px,3vw,40px)", fontFamily: F.display, color: C.text, letterSpacing: "-0.03em" }}>
                    <span style={{ fontWeight: 800 }}>Vaan</span><span style={{ fontWeight: 200, opacity: 0.45 }}>Forge</span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: F.mono, color: C.teal, opacity: 0.65, letterSpacing: "0.22em", marginTop: 6, textTransform: "uppercase" }}>{CO.tagline}</div>
                </div>
                <div style={{ fontSize: 10, fontFamily: F.body, color: C.muted }}>{CO.legal} · {CO.web}</div>
              </div>
            </div>
          </div>

          {/* Facebook / OG Cover — 820×312 */}
          <div>
            <DimLabel w="820px" h="312px" label="Facebook / OG — Cover Photo" />
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "820/312", position: "relative", background: `linear-gradient(120deg, #0b0e14 55%, #0d2e24 100%)` }}>
              <DotGrid opacity={0.4} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40%", background: "linear-gradient(135deg, transparent 0%, rgba(0,212,154,0.05) 100%)" }} />
              <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 7%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <VaanForgeMark size={40} color="#00d49a" />
                    <div style={{ fontSize: 26, fontFamily: F.display, color: C.text, letterSpacing: "-0.025em" }}>
                      <span style={{ fontWeight: 800 }}>Vaan</span><span style={{ fontWeight: 200, opacity: 0.45 }}>Forge</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: F.mono, color: C.teal, opacity: 0.65, letterSpacing: "0.18em", textTransform: "uppercase" }}>{CO.tagline}</div>
                  <div style={{ fontSize: 10, fontFamily: F.body, color: C.muted }}>{CO.legal}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ LETTER HEADERS ═════════════════════════════════════════════════ */}
      <section>
        <div style={{ fontSize: 12, fontFamily: F.mono, color: C.sub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28 }}>Letter & Document Headers</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>

          {/* Official Letterhead */}
          <div>
            <DimLabel w="A4" h="210mm" label="Official Letterhead" />
            <Paper>
              {/* Teal header band */}
              <div style={{ background: "#0b0e14", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <VaanForgeMark size={26} color="#00d49a" />
                  <div>
                    <div style={{ fontSize: 17, fontFamily: F.display, color: "#f0f4fa", letterSpacing: "-0.02em" }}>
                      <span style={{ fontWeight: 700 }}>Vaan</span><span style={{ fontWeight: 200, opacity: 0.55 }}>Forge</span>
                    </div>
                    <div style={{ fontSize: 8, fontFamily: F.mono, color: "#00d49a", opacity: 0.65, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{CO.tagline}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, fontFamily: F.body, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
                    {CO.legal}<br />{CO.address}<br />
                    <span style={{ color: "#00d49a" }}>{CO.web}</span>
                  </div>
                </div>
              </div>
              {/* Teal accent line */}
              <div style={{ height: 3, background: `linear-gradient(90deg, #00d49a 0%, #007a5e 100%)` }} />
              {/* Letter body placeholder */}
              <div style={{ padding: "20px 28px 16px" }}>
                <div style={{ fontSize: 9, color: "#5c6878", fontFamily: F.body, marginBottom: 12 }}>June 30, 2025 · Ref: VF-LTR-2025-0142</div>
                {["Dear Valued Partner,", "", "We are pleased to confirm that your VaanForge Professional subscription has been activated successfully. Your workspace is now ready.", "", "Please find attached the onboarding guide and API credentials for your team."].map((line, i) => (
                  <div key={i} style={{ height: line ? 10 : 8, background: line ? "#e8ecf2" : "transparent", borderRadius: 2, marginBottom: 6, width: line.length > 10 ? "100%" : line.length > 5 ? "60%" : "0%" }} />
                ))}
                <div style={{ height: 48 }} />
                {/* Signature area */}
                <div style={{ borderTop: "1px solid #e8ecf2", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ height: 9, width: 80, background: "#c8d0dc", borderRadius: 2, marginBottom: 5 }} />
                    <div style={{ fontSize: 9, color: "#5c6878", fontFamily: F.body }}>Authorised Signatory<br />{CO.legal}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 8, fontFamily: F.mono, color: "#9ca3b0", lineHeight: 1.8 }}>
                    CIN: {CO.cin}<br />GSTIN: {CO.gstin}
                  </div>
                </div>
              </div>
            </Paper>
          </div>

          {/* Invoice Header */}
          <div>
            <DimLabel w="A4" h="210mm" label="Invoice / Tax Invoice Header" />
            <Paper>
              <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #007a5e" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <VaanForgeMark size={20} color="#007a5e" />
                    <span style={{ fontSize: 14, fontFamily: F.display, color: "#0d1117", letterSpacing: "-0.02em" }}>
                      <span style={{ fontWeight: 700 }}>Vaan</span><span style={{ fontWeight: 300 }}>Forge</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 8, fontFamily: F.body, color: "#5c6878", lineHeight: 1.8 }}>
                    {CO.legal}<br />{CO.address}<br />
                    GSTIN: {CO.gstin} · CIN: {CO.cin}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: "#007a5e", letterSpacing: "0.04em" }}>TAX INVOICE</div>
                  <div style={{ fontSize: 9, fontFamily: F.mono, color: "#0d1117", marginTop: 4 }}>INV-2025-06-0847</div>
                  <div style={{ fontSize: 8, color: "#5c6878", fontFamily: F.body, marginTop: 2 }}>Date: Jun 30, 2025</div>
                  <div style={{ fontSize: 8, color: "#5c6878", fontFamily: F.body }}>Due: Jul 15, 2025</div>
                </div>
              </div>
              {/* Bill to */}
              <div style={{ padding: "12px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["Bill To", "Acme Corp Pvt. Ltd.\nMumbai, Maharashtra\nGSTIN: 27AABCA1234B1Z3"], ["Ship To (Digital)", "service@acmecorp.in\nWorkspace: acme-workspace\nPlan: Professional"]].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 8, fontFamily: F.mono, color: "#007a5e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 9, fontFamily: F.body, color: "#0d1117", lineHeight: 1.7, whiteSpace: "pre-line" }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Items stub */}
              <div style={{ margin: "0 28px 16px", borderRadius: 6, overflow: "hidden", border: "1px solid #e8ecf2" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, background: "#f5f7fa", padding: "6px 12px", borderBottom: "1px solid #e8ecf2" }}>
                  {["Description", "Qty", "Rate", "Amount"].map(h => <div key={h} style={{ fontSize: 8, fontFamily: F.mono, color: "#5c6878", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: h === "Description" ? "left" : "right" }}>{h}</div>)}
                </div>
                {[["Backend-priced plan", "1", "API", "API"], ["CGST @ 9%", "", "", "API"], ["SGST @ 9%", "", "", "API"]].map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, padding: "5px 12px", borderBottom: i < 2 ? "1px solid #e8ecf2" : "none", background: "#fff" }}>
                    {row.map((cell, j) => <div key={j} style={{ fontSize: 8, fontFamily: F.body, color: j === 0 ? "#0d1117" : "#5c6878", textAlign: j === 0 ? "left" : "right" }}>{cell}</div>)}
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0, padding: "6px 12px", background: "#007a5e" }}>
                  <div style={{ fontSize: 9, fontFamily: F.display, color: "#fff", fontWeight: 600 }}>Total (INR)</div>
                  <div style={{ fontSize: 9, fontFamily: F.mono, color: "#fff", fontWeight: 700 }}>API total</div>
                </div>
              </div>
            </Paper>
          </div>

          {/* Press Release Header */}
          <div>
            <DimLabel w="A4" h="120px" label="Press Release Header" />
            <Paper>
              <div style={{ padding: "18px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <VaanForgeMark size={18} color="#007a5e" />
                    <span style={{ fontSize: 13, fontFamily: F.display, color: "#0d1117", fontWeight: 700 }}>VaanForge</span>
                  </div>
                  <div style={{ fontSize: 8, fontFamily: F.mono, color: "#5c6878" }}>{CO.legal}</div>
                </div>
                <div style={{ height: 2, background: "#007a5e", marginBottom: 10 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, fontFamily: F.display, color: "#dc2626", letterSpacing: "0.12em", textTransform: "uppercase" }}>For Immediate Release</div>
                  <div style={{ fontSize: 8, color: "#5c6878", fontFamily: F.body }}>June 30, 2025 · Bengaluru, India</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.display, color: "#0d1117", marginTop: 10, lineHeight: 1.3 }}>
                  Vaan Technologies Launches VaanForge 1.3 with Blueprint Comparison and Multi-Model Support
                </div>
                <div style={{ height: 8 }} />
                {[100, 85, 95, 60].map((w, i) => <div key={i} style={{ height: 7, width: `${w}%`, background: "#e8ecf2", borderRadius: 2, marginBottom: 5 }} />)}
              </div>
            </Paper>
          </div>

          {/* NDA / Contract Header */}
          <div>
            <DimLabel w="A4" h="100px" label="Legal / Contract / NDA Header" />
            <Paper>
              <div style={{ height: 5, background: "#0b0e14" }} />
              <div style={{ padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <VaanForgeMark size={16} color="#007a5e" />
                    <span style={{ fontSize: 11, fontFamily: F.display, color: "#0d1117", fontWeight: 700 }}>VaanForge</span>
                    <span style={{ fontSize: 8, fontFamily: F.body, color: "#5c6878" }}>by {CO.legal}</span>
                  </div>
                  <div style={{ fontSize: 8, color: "#5c6878", fontFamily: F.body, lineHeight: 1.7 }}>
                    {CO.address}<br />CIN: {CO.cin}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.display, color: "#0d1117", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Non-Disclosure Agreement
                  </div>
                  <div style={{ fontSize: 8, color: "#5c6878", fontFamily: F.body, marginTop: 3 }}>Agreement No: VF-NDA-2025-0083 · Effective: Jun 30, 2025</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#e8ecf2", margin: "0 28px" }} />
              <div style={{ padding: "10px 28px 14px" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  {["Disclosing Party: Vaan Technologies Pvt. Ltd.", "Receiving Party: [Company Name]"].map((p, i) => (
                    <div key={i} style={{ flex: 1, background: "#f5f7fa", borderRadius: 6, padding: "8px 12px", border: "1px solid #e8ecf2" }}>
                      <div style={{ fontSize: 8, fontFamily: F.body, color: "#0d1117" }}>{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Paper>
          </div>

        </div>
      </section>

      {/* ═══ SPECS REFERENCE ════════════════════════════════════════════════ */}
      <section>
        <div style={{ fontSize: 12, fontFamily: F.mono, color: C.sub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Quick Reference — Asset Dimensions</div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Asset", "Platform", "Dimensions", "Format", "Notes"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Marketing Email Header", "Email", "600 × 120 px", "HTML + PNG", "Include plain-text fallback"],
                ["Transactional Header", "Email", "600 × 80 px", "HTML + PNG", "Light bg for Outlook compat"],
                ["Email Signature", "Email", "480 × 90 px", "HTML", "No background images"],
                ["Cover Photo", "Twitter / X", "1500 × 500 px", "PNG / JPG", "Keep logo in safe zone 1200 × 500"],
                ["Company Banner", "LinkedIn", "1128 × 191 px", "PNG / JPG", "Logo area: left 60%"],
                ["Personal Background", "LinkedIn", "1584 × 396 px", "PNG / JPG", "Profile pic overlaps bottom-left"],
                ["Channel Art", "YouTube", "2560 × 1440 px", "PNG", "Safe zone: 1546 × 423 px center"],
                ["Cover Photo", "Facebook", "820 × 312 px", "PNG / JPG", "Mobile crops to 640 × 360"],
                ["Official Letterhead", "Print / PDF", "A4 / 210 × 297 mm", "PDF (vector)", "Min 300 DPI for print"],
                ["Tax Invoice", "Print / PDF", "A4 / 210 × 297 mm", "PDF", "Include GST breakdown"],
                ["Press Release", "Print / PDF", "A4 / 210 × 297 mm", "PDF / DOCX", "Use official letterhead base"],
                ["Legal / NDA", "Print / PDF", "A4 / 210 × 297 mm", "PDF (signed)", "Requires authorised signatory"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: i < 11 ? `1px solid ${C.border}` : "none" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "9px 16px", fontSize: 12, fontFamily: j === 2 ? F.mono : F.body, color: j === 0 ? C.text : j === 2 ? C.teal : C.sub }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function BrandAssets() {
  const [tab, setTab] = useState<Tab>("Brand");
  const [splashOpen, setSplashOpen] = useState(false);
  const [pageModal, setPageModal] = useState<string | null>(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F.display }}>

      {/* ── Fixed header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: `rgba(7,9,15,0.85)`, backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark markSize={18} textSize={16} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: C.muted, letterSpacing: "0.08em" }}>BRAND DESIGN SYSTEM</div>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: C.teal, background: C.tealDim, padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(0,212,154,0.15)" }}>v2.0</div>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div style={{
        position: "sticky", top: 52, zIndex: 30,
        background: `rgba(7,9,15,0.85)`, backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flexShrink: 0, padding: "13px 16px",
                fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? C.teal : C.muted,
                background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: `2px solid ${tab === t ? C.teal : "transparent"}`,
                cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap", fontFamily: F.display,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px 96px" }}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {tab === "Brand" && <BrandTab onSplash={() => setSplashOpen(true)} />}
          {tab === "Favicon & Icons" && <FaviconTab />}
          {tab === "Loading" && <LoadingTab />}
          {tab === "Error States" && <ErrorTab />}
          {tab === "Success" && <SuccessTab />}
          {tab === "System Pages" && <SystemPagesTab onView={setPageModal} />}
          {tab === "Collateral" && <CollateralTab />}
        </motion.div>
      </main>

      {/* ── Overlays ── */}
      {splashOpen && <SplashScreen onClose={() => setSplashOpen(false)} />}
      {pageModal && <SystemPageModal id={pageModal} onClose={() => setPageModal(null)} />}
    </div>
  );
}
