import React, { useState, useEffect } from "react";
import { motion as rawMotion } from "framer-motion";
import {
  LayoutDashboard, FolderOpen, Cpu, Hammer, ShieldCheck,
  Rocket, CreditCard, Settings, ChevronLeft, ChevronRight,
  Plus, Search, Bell, User, Sun, Moon, Monitor, Loader2,
  CheckCircle2, FileText, GitBranch, Code2, Database, Shield, Lock,
  Box, KeyRound, Webhook, BarChart3, Store, ClipboardCheck,
  MessageSquare, Cloud,
  Send, Sparkles, Menu, X,
} from "lucide-react";
import type { PageProps } from "./App";
import { apiClient } from "../services/apiClient";

const motion = rawMotion as any;

// â”€â”€ Logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Mark = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
    <path d="M5 5L16 26L27 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="26" r="2.5" fill="currentColor" />
    <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
    <circle cx="27" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
  </svg>
);

// â”€â”€ Greeting helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const QUESTIONS = [
  "What would you like to build today?",
  "What are your plans for today?",
  "Ready to continue where you left off?",
  "Which idea is on your mind today?",
  "What software challenge can I help with?",
  "What should we build next?",
  "Which project needs your attention first?",
  "What are we shipping today?",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// â”€â”€ Theme Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ThemeToggle({ dark, toggleTheme }: { dark: boolean; toggleTheme: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = dark ? Moon : Sun;
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Theme">
        <Icon size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-card border border-border rounded-xl shadow-xl p-1 flex gap-1 z-50">
          {[{ I: Monitor, l: "System" }, { I: Sun, l: "Light" }, { I: Moon, l: "Dark" }].map(({ I, l }) => (
            <button key={l} title={l} onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <I size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Top Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV = [
  { id: "workspace", label: "Workspace", icon: LayoutDashboard },
  { id: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  { id: "projects",  label: "Projects",  icon: FolderOpen },
  { id: "factory",   label: "Factory",   icon: Cpu },
  { id: "builds",    label: "Builds",    icon: Hammer },
  { id: "validations", label: "Validations", icon: ShieldCheck },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "pricing",   label: "Pricing",   icon: CreditCard },
  { id: "product-health", label: "Health", icon: ShieldCheck },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "automation", label: "Automation", icon: GitBranch },
  { id: "admin-monitoring", label: "Monitoring", icon: BarChart3 },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "settings",  label: "Settings",  icon: Settings },
];

interface TopNavProps extends PageProps { onMobileMenu: () => void; }

function TopNav({ route, navigate, dark, toggleTheme, onMobileMenu }: TopNavProps) {
  return (
    <header className="h-12 shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-3 gap-2 z-40">
      {/* Mobile menu */}
      <button onClick={onMobileMenu} aria-label="Open sidebar" className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted">
        <Menu size={15} />
      </button>

      {/* Logo */}
      <button onClick={() => navigate("workspace")} className="flex items-center gap-1.5 text-primary shrink-0">
        <Mark size={17} />
        <span className="text-sm tracking-tight leading-none hidden sm:block">
          <span className="font-semibold">Vaan</span>
          <span className="font-light opacity-65">Forge</span>
        </span>
      </button>

      {/* Center nav â€” desktop */}
      <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto ml-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => navigate(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              route === id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>
            <Icon size={12} />{label}
          </button>
        ))}
      </nav>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1">
        <button onClick={() => navigate("about")} className="hidden md:block text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted">About</button>
        <ThemeToggle dark={dark} toggleTheme={toggleTheme} />
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted relative">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        <button onClick={() => navigate("profile")} className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" aria-label="Open profile">
          <User size={13} />
        </button>
      </div>
    </header>
  );
}

// â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HISTORY = {
  Today: [
    { id: 1, title: "EcommerceAPI v1", project: "EcommerceAPI", status: "approval", time: "12m" },
    { id: 2, title: "Auth scaffold", project: "AuthService", status: "complete", time: "2h" },
  ],
  Yesterday: [
    { id: 3, title: "MobileApp backend", project: "MobileAPI", status: "building", time: "1d" },
    { id: 4, title: "Data pipeline v2", project: "DataPipeline", status: "complete", time: "1d" },
  ],
  "Last 7 days": [
    { id: 5, title: "User auth API", project: "UserAuth", status: "complete", time: "3d" },
    { id: 6, title: "File upload svc", project: "FileService", status: "complete", time: "5d" },
  ],
};

const SBADGE: Record<string, string> = {
  approval: "text-amber-500 bg-amber-500/10",
  complete:  "text-primary bg-primary/10",
  building:  "text-blue-500 bg-blue-500/10",
  failed:    "text-red-500 bg-red-500/10",
};

interface SidebarProps {
  open: boolean; onToggle: () => void;
  activeChat: number; setActiveChat: (id: number) => void;
  navigate: (route: string) => void;
}

function Sidebar({ open, onToggle, activeChat, setActiveChat, navigate }: SidebarProps) {
  return (
    <aside className={`relative shrink-0 border-r border-border bg-sidebar flex flex-col transition-all duration-200 h-full ${open ? "w-56" : "w-12"}`}>
      <button onClick={onToggle}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-colors">
        {open ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {open ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-2.5 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted rounded-lg">
              <Search size={11} className="text-muted-foreground shrink-0" />
              <input className="text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-full" placeholder="Search history..." />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-3">
            {Object.entries(HISTORY).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-widest font-medium" style={{ fontSize: 9 }}>{group}</div>
                {items.map(item => (
                  <button key={item.id} onClick={() => setActiveChat(item.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors ${activeChat === item.id ? "bg-sidebar-accent" : ""}`}>
                    <div className="text-xs font-medium text-foreground truncate">{item.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate" style={{ fontSize: 10 }}>{item.project}</span>
                      <span className={`ml-auto text-xs px-1 py-0.5 rounded-full shrink-0 ${SBADGE[item.status]}`} style={{ fontSize: 9 }}>{item.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-border p-2.5 space-y-2 bg-sidebar/95">
            <button onClick={() => navigate("projects")} className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-sm">
              <Plus size={13} /> New project
            </button>
            <button onClick={() => navigate("profile")} className="w-full text-left flex items-center gap-2 rounded-xl border border-border bg-card/70 p-2 hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">AV</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">Arjun Varma</div>
                <div className="text-xs text-muted-foreground truncate" style={{ fontSize: 10 }}>Professional workspace</div>
              </div>
              <span onClick={(event) => { event.stopPropagation(); navigate("settings"); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Profile settings" role="button" tabIndex={0}>
                <Settings size={12} />
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 pt-2.5 px-1.5 h-full">
          <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"><Plus size={13} /></button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><Search size={13} /></button>
          <div className="w-5 h-px bg-border my-1" />
          {[1, 2, 3].map(i => (
            <button key={i} onClick={() => setActiveChat(i)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeChat === i ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <MessageSquare size={12} />
            </button>
          ))}
          <div className="mt-auto pb-2 flex flex-col items-center gap-2">
            <button onClick={() => navigate("profile")} className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">AV</button>
            <button onClick={() => navigate("settings")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><Settings size={12} /></button>
          </div>
        </div>
      )}
    </aside>
  );
}
/* Mobile drawer overlay */
function MobileDrawer({ open, onClose, activeChat, setActiveChat, navigate }: { open: boolean; onClose: () => void; activeChat: number; setActiveChat: (id: number) => void; navigate: (route: string) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 max-w-[86vw] bg-sidebar border-r border-border flex flex-col h-full z-10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-primary"><Mark size={16} /><span className="text-sm font-semibold">VaanForge</span></div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><X size={14} /></button>
        </div>
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted rounded-lg">
            <Search size={11} className="text-muted-foreground shrink-0" />
            <input className="text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-full" placeholder="Search history..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {Object.entries(HISTORY).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-widest" style={{ fontSize: 9 }}>{group}</div>
              {items.map(item => (
                <button key={item.id} onClick={() => { setActiveChat(item.id); onClose(); }}
                  className={`w-full text-left px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors ${activeChat === item.id ? "bg-sidebar-accent" : ""}`}>
                  <div className="text-xs font-medium text-foreground truncate">{item.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground" style={{ fontSize: 10 }}>{item.project}</span>
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${SBADGE[item.status]}`} style={{ fontSize: 9 }}>{item.status}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="shrink-0 border-t border-border p-3 space-y-2">
          <button onClick={() => { navigate("projects"); onClose(); }} className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"><Plus size={13} /> New project</button>
          <button onClick={() => { navigate("profile"); onClose(); }} className="w-full text-left flex items-center gap-2 rounded-xl border border-border bg-card/70 p-2 hover:border-primary/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">AV</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">Arjun Varma</div>
              <div className="text-xs text-muted-foreground truncate" style={{ fontSize: 10 }}>Professional workspace</div>
            </div>
            <span onClick={(event) => { event.stopPropagation(); navigate("settings"); onClose(); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Profile settings" role="button" tabIndex={0}>
              <Settings size={12} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
// â”€â”€ Workspace Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WorkspaceDashboard() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const greeting = getGreeting();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

  const handleSend = () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setTimeout(() => { setSending(false); setInput(""); }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">{dateStr}</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                {greeting}, <span className="text-primary">Arjun</span>
              </h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Ready for a new build
            </div>
          </div>

          <section className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className="mb-5 flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Start from one clear idea</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{question}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-3 focus-within:border-primary/50 transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }}
                  className="min-h-32 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="Describe the product, users, core workflow, integrations, and where you want it deployed. Keep it rough; VaanForge will ask what is missing."
                />
                <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">Requirements</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">Blueprint</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">Build plan</span>
                  </div>
                  <button onClick={handleSend} disabled={!input.trim() || sending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
                    {sending
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}><Loader2 size={12} /></motion.div>
                      : <Send size={12} />
                    }
                    Generate next step
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Describe", "Write the idea in plain language."],
              ["2", "Clarify", "Answer only the missing questions."],
              ["3", "Approve", "Review the blueprint before build."],
            ].map(([n, title, text]) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">{n}</div>
                <div className="text-sm font-medium text-foreground">{title}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// â”€â”€ Projects View â€” fixed grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProjectsView() {
  const projects = [
    { name: "EcommerceAPI", desc: "REST API for e-commerce platform", status: "approval", modules: 16, plan: "Pro", updated: "12m ago" },
    { name: "AuthService",  desc: "JWT-based authentication service", status: "complete",  modules: 8,  plan: "Pro", updated: "2h ago" },
    { name: "MobileAPI",    desc: "Backend for React Native app",      status: "building",  modules: 12, plan: "Pro", updated: "1d ago" },
    { name: "DataPipeline", desc: "ETL pipeline with PostgreSQL",       status: "complete",  modules: 6,  plan: "Pro", updated: "1d ago" },
    { name: "Notifications",desc: "Push notification microservice",      status: "complete",  modules: 5,  plan: "Pro", updated: "3d ago" },
    { name: "SearchService",desc: "Full-text search with Elasticsearch", status: "complete",  modules: 7,  plan: "Pro", updated: "5d ago" },
  ];
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Fixed header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{projects.length} projects Â· Professional plan</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Search size={12} className="text-muted-foreground" />
            <input className="text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-28" placeholder="Search projectsâ€¦" />
          </div>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
            <Plus size={13} /> New Project
          </button>
        </div>
      </div>
      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.name} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen size={16} className="text-primary" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SBADGE[p.status]}`}>{p.status}</span>
              </div>
              <div className="font-semibold text-foreground text-sm">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</div>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground border-t border-border pt-3">
                <span>{p.modules} modules</span>
                <span>Â·</span><span>{p.plan}</span>
                <span className="ml-auto">{p.updated}</span>
              </div>
            </div>
          ))}
          {/* New project card */}
          <button className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Builds View â€” fixed header table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BUILDS = [
  { id: "VF-0847", project: "EcommerceAPI", status: "pending",  trigger: "Blueprint approved",  time: "Waiting", dur: "â€”" },
  { id: "VF-0846", project: "AuthService",  status: "complete", trigger: "Manual",              time: "2h ago",  dur: "2m 12s" },
  { id: "VF-0845", project: "MobileAPI",    status: "building", trigger: "Requirement update",  time: "1d ago",  dur: "Runningâ€¦" },
  { id: "VF-0844", project: "DataPipeline", status: "complete", trigger: "Blueprint approved",  time: "1d ago",  dur: "4m 38s" },
  { id: "VF-0843", project: "Notifications",status: "complete", trigger: "Manual",              time: "3d ago",  dur: "1m 44s" },
  { id: "VF-0842", project: "SearchService",status: "complete", trigger: "Blueprint approved",  time: "5d ago",  dur: "6m 02s" },
];

function BuildsView() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Builds</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Build history across all projects</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col mx-6 my-5">
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
          {/* Fixed table header */}
          <div className="shrink-0 grid border-b border-border bg-muted/40" style={{ gridTemplateColumns: "110px 1fr 1fr 100px 90px 90px" }}>
            {["Build ID", "Project", "Trigger", "Status", "Duration", "Time"].map(h => (
              <div key={h} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">{h}</div>
            ))}
          </div>
          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto">
            {BUILDS.map((b, i) => (
              <div key={b.id} className={`grid hover:bg-muted/30 cursor-pointer transition-colors ${i < BUILDS.length - 1 ? "border-b border-border" : ""}`}
                style={{ gridTemplateColumns: "110px 1fr 1fr 100px 90px 90px" }}>
                <div className="px-4 py-3 font-mono text-xs text-primary">{b.id}</div>
                <div className="px-4 py-3 text-xs text-foreground">{b.project}</div>
                <div className="px-4 py-3 text-xs text-muted-foreground">{b.trigger}</div>
                <div className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SBADGE[b.status]}`}>{b.status}</span></div>
                <div className="px-4 py-3 text-xs text-muted-foreground font-mono">{b.dur}</div>
                <div className="px-4 py-3 text-xs text-muted-foreground">{b.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pricing View - backend source of truth
type BillingPlan = {
  planId: string;
  tier: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  limits: Record<string, number>;
  creditsIncluded: number;
  features: string[];
  status: string;
};

type UsageLimit = {
  metric: string;
  limit: number;
  used: number;
};

type BillingUsage = {
  limits: UsageLimit[];
  events: unknown[];
};

type CheckoutSessionSummary = {
  paymentProvider: { provider: string; configured: boolean; status: string; nextAction: string };
  plans: BillingPlan[];
  usage: BillingUsage;
};

function formatMoney(amount: number, currency: string, cycle: "monthly" | "annual") {
  if (amount === 0) return "Free";
  const normalized = cycle === "annual" ? amount / 100 / 12 : amount / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(normalized);
}

function formatLimit(metric: string, value: number) {
  if (value >= 1000000) return "Unlimited";
  if (metric === "storage_mb") return value >= 1024 * 1024 ? `${Math.round(value / 1024 / 1024)} TB` : `${Math.round(value / 1024)} GB`;
  return new Intl.NumberFormat("en-IN").format(value);
}

function metricLabel(metric: string) {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function PricingView() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [checkout, setCheckout] = useState<CheckoutSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient<BillingPlan[]>("/billing/builder/plans"),
      apiClient<BillingUsage>("/billing/builder/usage"),
      apiClient<CheckoutSessionSummary>("/billing/checkout/session").catch(() => null)
    ])
      .then(([loadedPlans, loadedUsage, checkoutSummary]) => {
        if (!alive) return;
        setPlans(loadedPlans.filter((plan) => plan.status === "active"));
        setUsage(loadedUsage);
        setCheckout(checkoutSummary);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Billing plans could not be loaded.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const professionalPlan = plans.find((plan) => plan.tier === "pro" || plan.name === "Professional");
  const currentPlanId = usage?.limits[0]?.metric ? usage.limits.find(Boolean) && checkout?.usage?.limits?.[0]?.metric ? undefined : undefined : undefined;
  const matrixMetrics = ["agent_run", "team_member", "ai_credit", "storage_mb", "deployment", "template_use"];

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
      <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-5 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pricing and usage</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Loaded from the VaanForge billing API with server-side limits, GST-ready checkout, and real usage events.</p>
          <p className="text-xs text-muted-foreground mt-2">Plans: Free, Creator, Professional, Studio, Business, Enterprise.</p>
        </div>

        {loading && (
          <div className="space-y-3" aria-label="Loading billing usage">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 rounded-xl bg-muted animate-pulse" />)}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-medium text-foreground">Billing requires sign in</div>
            <p className="mt-1 text-xs text-muted-foreground">{error}. Sign in to view workspace plans, invoices, credits, and usage limits.</p>
          </div>
        )}

        {!loading && !error && (!usage || usage.limits.length === 0) && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-medium text-foreground">No usage recorded yet</div>
            <p className="mt-1 text-xs text-muted-foreground">Start a project or agent run to create usage events against your active plan.</p>
          </div>
        )}

        {!loading && !error && usage && usage.limits.length > 0 && (
          <div className="space-y-4">
            {usage.limits.map(({ metric, used, limit }) => {
              const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              return (
                <div key={metric}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{metricLabel(metric)}</span>
                    <span className="text-muted-foreground font-mono">{used}/{limit}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{pct}% used</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 mt-auto">
          <div className="text-xs font-medium text-foreground mb-2">Checkout readiness</div>
          <p className="text-xs text-muted-foreground">
            {checkout?.paymentProvider.configured
              ? "Razorpay is configured. Checkout can create provider sessions after terms acceptance."
              : "Payment provider setup is required before paid checkout can complete."}
          </p>
          <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">{checkout?.paymentProvider.status || "loading"}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Choose a VaanForge plan</h2>
            <p className="text-xs text-muted-foreground mt-1">Free includes 1 Project Free Forever. Yearly billing gives 2 months free.</p>
          </div>
          <div className="flex items-center bg-muted rounded-lg p-0.5 w-max">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button key={cycle} onClick={() => setBilling(cycle)}
                className={`text-xs px-3 py-1.5 rounded-md capitalize transition-colors ${billing === cycle ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground"}`}>
                {cycle}{cycle === "annual" && <span className="text-primary ml-1">2 months free</span>}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-56 rounded-xl bg-muted animate-pulse" />)}</div>}

        {!loading && error && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-semibold text-foreground">Plans are not available in this session</div>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">The pricing page no longer embeds hardcoded prices. Authenticate into a workspace to load editable plans from the billing service.</p>
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-semibold text-foreground">No active plans</div>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">Ask a billing admin to publish at least one active plan before customers can subscribe.</p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {plans.map((plan) => {
                const popular = plan.planId === professionalPlan?.planId;
                const amount = billing === "annual" ? plan.yearlyPrice : plan.monthlyPrice;
                const monthlyEquivalent = formatMoney(amount, plan.currency, billing);
                const isCurrent = currentPlanId === plan.planId;
                return (
                  <div key={plan.planId} className={`bg-card border rounded-2xl p-4 relative ${popular ? "border-primary shadow-sm" : "border-border"}`}>
                    {popular && <div className="absolute -top-2.5 left-4 text-xs px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Most Popular</div>}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{plan.name}</div>
                        <p className="mt-1 min-h-10 text-xs text-muted-foreground">{plan.name === "Free" ? "1 Project Free Forever." : plan.description}</p>
                      </div>
                      {isCurrent && <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Current</span>}
                    </div>
                    <div className="flex items-baseline gap-1 mt-3 mb-3">
                      <span className="text-xl font-bold text-foreground">{plan.name === "Enterprise" ? "Custom" : monthlyEquivalent}</span>
                      {plan.name !== "Enterprise" && amount > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {["agent_run", "team_member", "ai_credit", "storage_mb"].map((metric) => (
                        <div key={metric} className="rounded-lg bg-muted px-2.5 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{metricLabel(metric)}</div>
                          <div className="mt-0.5 text-xs font-medium text-foreground">{formatLimit(metric, plan.limits[metric] || 0)}</div>
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-1 mb-4">
                      {plan.features.slice(0, 5).map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 size={10} className="text-primary shrink-0" />{feature}
                        </li>
                      ))}
                    </ul>
                    <p className="mb-3 text-xs text-muted-foreground">{plan.name === "Enterprise" ? "Custom procurement, security review, and dedicated rollout." : "Locked premium features unlock automatically after backend subscription update."}</p>
                    <button disabled={isCurrent} className={`w-full text-xs py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${plan.name === "Enterprise" ? "border border-border text-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                      {isCurrent ? "Current plan" : plan.name === "Enterprise" ? "Contact sales" : "Upgrade"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Compare limits</h3>
                  <p className="text-xs text-muted-foreground mt-1">Feature access and limits are read from the billing API, then enforced server-side before protected actions.</p>
                </div>
                <div className="text-xs text-muted-foreground">GST applies at checkout. Yearly billing equals 10 months.</div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Limit</th>
                      {plans.map((plan) => <th key={plan.planId} className="py-2 px-3 font-medium">{plan.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixMetrics.map((metric) => (
                      <tr key={metric} className="border-b border-border/70">
                        <td className="py-2 pr-3 font-medium text-foreground">{metricLabel(metric)}</td>
                        {plans.map((plan) => <td key={plan.planId} className="py-2 px-3 text-muted-foreground">{formatLimit(metric, plan.limits[metric] || 0)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">AI credits</h3>
                <p className="mt-2 text-xs text-muted-foreground">Credits are deducted by backend usage policies for agent runs, templates, deployments, build minutes, and regenerations.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Policies</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {["Refund policy", "Terms", "Privacy", "Plan limits"].map((item) => <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item}</span>)}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Enterprise</h3>
                <p className="mt-2 text-xs text-muted-foreground">Need procurement, security review, custom limits, or dedicated rollout? Contact sales from the Enterprise plan.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">FAQ</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {[
                  ["Can I stay free?", "Yes. Free includes one active project forever."],
                  ["What happens at a limit?", "The backend blocks the action and returns a plan-limit response with an upgrade path."],
                  ["Are payments live?", checkout?.paymentProvider.configured ? "Yes. Provider checkout can be created." : "Not yet. Checkout shows provider setup required instead of fake success."],
                  ["Can plans change?", "Billing admins can update plan metadata and price history is tracked."]
                ].map(([q, a]) => (
                  <div key={q} className="rounded-xl bg-muted p-3">
                    <div className="text-xs font-medium text-foreground">{q}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// Settings View â€” fixed TOC + scrollable content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfileView({ navigate }: { navigate: (route: string) => void }) {
  const details = [
    ["Role", "Owner"],
    ["Workspace", "Professional workspace"],
    ["Plan", "Professional"],
    ["Region", "India"],
  ];
  const access = [
    ["Projects", "Create, approve, and archive projects"],
    ["Billing", "Manage subscription and invoices"],
    ["Deployments", "Approve release and rollback actions"],
    ["Developer API", "Create and revoke API keys"],
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary">Profile</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Arjun Varma</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage identity, workspace access, security, and billing context.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("settings")} className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">Edit settings</button>
            <button onClick={() => navigate("pricing")} className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Manage plan</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">AV</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">Account identity</h2>
                <p className="mt-1 text-sm text-muted-foreground">arjun@vaanforge.local</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Verified email</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">MFA ready</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Owner access</span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Security status</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Password", "Updated 18 days ago"],
                ["Session", "Current device active"],
                ["API keys", "2 active keys"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-background p-3">
                  <div>
                    <div className="text-xs font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{value}</div>
                  </div>
                  <CheckCircle2 size={14} className="text-primary" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Workspace permissions</h2>
                <p className="mt-1 text-xs text-muted-foreground">What this profile can access inside VaanForge.</p>
              </div>
              <button onClick={() => navigate("settings")} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">Review</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {access.map(([title, text]) => (
                <div key={title} className="rounded-xl border border-border bg-background p-4">
                  <div className="text-sm font-medium text-foreground">{title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
const SETTINGS_SECTIONS = ["Profile", "Workspace", "API Keys", "Notifications", "Danger Zone"];

function SettingsView() {
  const [active, setActive] = useState("Profile");
  const [name, setName] = useState("Arjun Sharma");
  const [ws, setWs] = useState("Company Workspace");

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Fixed left TOC */}
      <div className="w-48 shrink-0 border-r border-border p-3 flex flex-col gap-0.5">
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium px-2 py-2" style={{ fontSize: 9 }}>Settings</div>
        {SETTINGS_SECTIONS.map(s => (
          <button key={s} onClick={() => setActive(s)}
            className={`w-full text-left text-xs px-2 py-2 rounded-lg transition-colors ${active === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {s}
          </button>
        ))}
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl space-y-6">
          {active === "Profile" && (
            <>
              <h2 className="text-base font-semibold text-foreground">Profile</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">A</div>
                <button className="text-xs text-primary hover:underline">Change avatar</button>
              </div>
              {[["Full name", name, setName], ["Work email", "arjun@company.com", null]].map(([l, v, s]) => (
                <div key={l as string}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{l as string}</label>
                  <input value={v as string} onChange={s ? (e: React.ChangeEvent<HTMLInputElement>) => (s as (v: string) => void)(e.target.value) : undefined} readOnly={!s}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
                </div>
              ))}
              <button className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">Save Profile</button>
            </>
          )}
          {active === "Workspace" && (
            <>
              <h2 className="text-base font-semibold text-foreground">Workspace</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Workspace name</label>
                <input value={ws} onChange={e => setWs(e.target.value)} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Workspace slug</label>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <span className="px-3 py-2 text-xs text-muted-foreground bg-muted border-r border-border">app.vaanforge.io/</span>
                  <input defaultValue="company-workspace" className="flex-1 bg-muted/50 px-3 py-2 text-sm text-foreground outline-none" />
                </div>
              </div>
              <button className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">Save Workspace</button>
            </>
          )}
          {active === "API Keys" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">API Keys</h2>
                <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"><Plus size={11} /> New Key</button>
              </div>
              {[["Production Key", "vf_live_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢", "Jun 1, 2025"], ["Development Key", "vf_test_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢", "May 15, 2025"]].map(([n, k, d]) => (
                <div key={n} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-foreground">{n}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">{k}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{d}</span>
                    <button className="text-red-500 hover:text-red-400">Revoke</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {active === "Notifications" && (
            <>
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
              {[["Build complete", "Get notified when a build finishes", true], ["Approval required", "Alert when blueprint needs review", true], ["Deployment live", "Notify when deployment is live", false], ["Plan limit warnings", "Alert at 80% usage", true]].map(([l, d, on]) => (
                <div key={l as string} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm text-foreground">{l as string}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d as string}</div>
                  </div>
                  <button className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </>
          )}
          {active === "Danger Zone" && (
            <>
              <h2 className="text-base font-semibold text-red-500">Danger Zone</h2>
              {[["Delete all projects", "Permanently delete all projects and their data. This cannot be undone."], ["Close account", "Delete your account and all associated data."]].map(([t, d]) => (
                <div key={t} className="bg-card border border-red-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d}</div>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors shrink-0">
                    {t?.toString().split(" ")[0]}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Placeholder for Factory / Validations / Deployments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PlaceholderView({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-xs">Available once you have active builds. Start a new project from the Workspace to access this section.</p>
      <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
        <Plus size={14} /> New Project
      </button>
    </div>
  );
}

// â”€â”€ Root WorkspaceApp â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type SurfacePageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  primary: string;
  secondary?: string;
  icon: React.ElementType;
  contract: string;
  checkpoints: string[];
};

const SURFACE_PAGES: Record<string, SurfacePageConfig> = {
  onboarding: { eyebrow: "Lifecycle", title: "First-time onboarding", description: "Resume the customer setup flow across welcome, workspace, role, use case, first project, AI introduction, providers, billing, and success.", primary: "Continue onboarding", secondary: "View setup", icon: ClipboardCheck, contract: "GET/PATCH /api/v1/onboarding", checkpoints: ["Resume progress", "Skip completed steps", "Autosave", "Database-backed"] },
  "product-tours": { eyebrow: "Lifecycle", title: "Contextual product tours", description: "Dashboard, project, factory, billing, marketplace, developer, and support tours are shown once, tracked, and replayable.", primary: "Start tour", secondary: "Replay", icon: Sparkles, contract: "GET/POST /api/v1/onboarding/tours", checkpoints: ["Completion memory", "Replay", "Analytics", "No repeat spam"] },
  "command-palette": { eyebrow: "Navigation", title: "Command palette", description: "Search projects, pages, commands, settings, API keys, marketplace, support, and docs from a keyboard-first command center.", primary: "Open palette", secondary: "View shortcuts", icon: Search, contract: "GET/POST /api/v1/onboarding/command-palette", checkpoints: ["Ctrl/Cmd + K", "Grouped commands", "Usage tracking", "Real actions"] },
  "global-search": { eyebrow: "Search", title: "Global search", description: "Search projects, blueprints, files, tasks, deployments, marketplace, docs, tickets, users, and settings with grouped results.", primary: "Search workspace", secondary: "Open docs", icon: Search, contract: "GET /api/v1/onboarding/search", checkpoints: ["Grouped results", "Tenant isolation", "No fake rows", "Deep links"] },
  notifications: { eyebrow: "Notifications", title: "Notification center", description: "Unified billing, project, agent, deployment, marketplace, support, security, and announcement notifications with deep links.", primary: "Mark all read", secondary: "Filter unread", icon: Bell, contract: "GET /api/v1/notifications", checkpoints: ["Read/unread", "Archive", "Source filters", "Deep links"] },
  automation: { eyebrow: "Automation", title: "Workspace automation center", description: "Create database-driven automations for deployments, blueprint approvals, low credits, failed payments, and completed AI runs.", primary: "Create automation", secondary: "Browse templates", icon: GitBranch, contract: "POST /api/v1/automation/rules", checkpoints: ["Triggers", "Actions", "Approval requests", "Audit logs"] },
  "workspace-analytics": { eyebrow: "Analytics", title: "Workspace analytics", description: "Review projects, credits, storage, deployments, API usage, users, marketplace installs, billing, and support from backend state.", primary: "Refresh analytics", secondary: "View usage", icon: BarChart3, contract: "GET /api/v1/onboarding/workspace-analytics", checkpoints: ["Projects", "Credits", "Storage", "Support"] },
  "product-health": { eyebrow: "Health", title: "Product health and next actions", description: "See workspace completeness, security score, billing status, provider readiness, documentation, team completeness, and project health.", primary: "Review next action", secondary: "Open providers", icon: ShieldCheck, contract: "GET /api/v1/onboarding/product-health", checkpoints: ["Recommendations", "Provider readiness", "Billing status", "Setup score"] },
  "admin-releases": { eyebrow: "Release", title: "Release lifecycle", description: "Draft, approve, publish, deploy, roll back, and archive releases with changelog, migration notes, known issues, rollback notes, deployment checklist, and approval history.", primary: "Draft release", secondary: "View changelog", icon: FileText, contract: "POST /api/v1/releases", checkpoints: ["Lifecycle status", "Approval history", "Rollback notes", "Deployment checklist"] },
  "admin-release-detail": { eyebrow: "Release", title: "Release detail", description: "Inspect version, changelog, migration notes, known issues, rollback notes, deployment checklist, and approval history.", primary: "Approve release", secondary: "Archive", icon: FileText, contract: "GET /api/v1/releases/:releaseId", checkpoints: ["Version", "Approvals", "Known issues", "Rollback"] },
  "admin-monitoring": { eyebrow: "Monitoring", title: "Operational monitoring", description: "Monitor API latency, error rate, database, queue, workers, providers, billing webhooks, storage, and deployment health from backend state.", primary: "Refresh", secondary: "Open alerts", icon: BarChart3, contract: "GET /api/v1/admin/monitoring/overview", checkpoints: ["Real health", "Setup required state", "No fake uptime", "Provider readiness"] },
  "admin-monitoring-services": { eyebrow: "Monitoring", title: "Service health", description: "Review real service health checks and evidence for API, database, queue, deployment, and provider status.", primary: "View services", secondary: "Create incident", icon: ShieldCheck, contract: "GET /api/v1/admin/monitoring/services", checkpoints: ["Evidence", "Latency", "Status", "Next action"] },
  "admin-monitoring-queues": { eyebrow: "Monitoring", title: "Queue health", description: "Track pending and failed jobs, queue latency, queued agent runs, and execution backlog.", primary: "Review queue", secondary: "Open workers", icon: GitBranch, contract: "GET /api/v1/admin/monitoring/queues", checkpoints: ["Pending", "Failed", "Latency", "Backlog"] },
  "admin-monitoring-errors": { eyebrow: "Monitoring", title: "Error monitoring", description: "Review stored agent and factory errors with safe evidence and recovery action.", primary: "Review errors", secondary: "Create incident", icon: Shield, contract: "GET /api/v1/admin/monitoring/errors", checkpoints: ["Source", "Reason", "Fix attempt", "Status"] },
  "admin-monitoring-providers": { eyebrow: "Monitoring", title: "Provider monitoring", description: "Review AI, billing, cloud, storage, email, analytics, and Figma readiness without exposing secrets.", primary: "Run health check", secondary: "Open setup", icon: Cloud, contract: "GET /api/v1/admin/monitoring/providers", checkpoints: ["Masked secrets", "Missing paths", "Status", "Next setup"] },
  "admin-alerts": { eyebrow: "Alerts", title: "Alerting rules and events", description: "Create rules and acknowledge or resolve alerts for API down, high error rate, queue stuck, provider unavailable, billing webhook failure, deployment failure, and suspicious usage.", primary: "Create rule", secondary: "Acknowledge", icon: Bell, contract: "GET/POST /api/v1/admin/alerts", checkpoints: ["Rules", "Events", "Acknowledgements", "Notifications"] },
  "admin-customer-success": { eyebrow: "Customer success", title: "Customer success dashboard", description: "Track onboarding completion, first project, first blueprint, first deployment, credit usage, support tickets, plan status, churn risk, and upgrade opportunity.", primary: "Review accounts", secondary: "Create task", icon: User, contract: "GET /api/v1/admin/customer-success/overview", checkpoints: ["Health score", "Milestones", "Churn risk", "Upgrade signal"] },
  "admin-customer-account": { eyebrow: "Customer success", title: "Customer account detail", description: "Review account health, notes, tasks, usage, billing, support tickets, and adoption milestones.", primary: "Add note", secondary: "Create task", icon: User, contract: "GET /api/v1/admin/customer-success/accounts/:accountId", checkpoints: ["Notes", "Tasks", "Usage", "Support"] },
  "admin-executive": { eyebrow: "Executive", title: "Executive control center", description: "Review MRR, ARR, subscriptions, conversion, churn, AI credits, costs, API usage, deployments, support, incidents, marketplace, and partner revenue from backend records.", primary: "Refresh KPIs", secondary: "Export report", icon: BarChart3, contract: "GET /api/v1/admin/executive", checkpoints: ["MRR", "ARR", "Cost", "Source evidence"] },
  "admin-business-crm": { eyebrow: "Business", title: "CRM and sales pipeline", description: "Manage leads, contacts, companies, opportunities, deals, tasks, meetings, notes, and pipeline stages for KRAVIA sales.", primary: "Create opportunity", secondary: "View leads", icon: User, contract: "GET/POST /api/v1/crm/opportunities", checkpoints: ["Pipeline", "Owner", "Value", "Activity history"] },
  "admin-business-finance": { eyebrow: "Business", title: "Finance operations", description: "Track revenue, expenses, subscriptions, refunds, taxes, cash flow, P&L, exports, and monthly reports from finance records.", primary: "Open P&L", secondary: "Export finance", icon: CreditCard, contract: "GET /api/v1/finance/overview", checkpoints: ["Revenue", "Expenses", "GST", "Cash flow"] },
  "admin-business-subscriptions": { eyebrow: "Business", title: "Subscription operations", description: "Track renewals, failed payments, expired plans, trials ending, low credits, cancellations, refunds, and admin actions.", primary: "Review queue", secondary: "Grant credits", icon: CreditCard, contract: "GET /api/v1/admin/business/subscription-operations", checkpoints: ["Renewals", "Failed payments", "Low credits", "Audit"] },
  "admin-business-ai-costs": { eyebrow: "Business", title: "AI cost management", description: "Track provider requests, tokens, latency, errors, estimated cost, credits consumed, workspace cost, project cost, and agent cost.", primary: "Record cost", secondary: "View providers", icon: Cpu, contract: "GET /api/v1/admin/business/ai-costs", checkpoints: ["Tokens", "Latency", "Errors", "Credits"] },
  "admin-business-infrastructure": { eyebrow: "Business", title: "Infrastructure cost estimates", description: "Track compute, storage, bandwidth, cache, database, email, AI provider, marketplace, and support costs by workspace, project, and deployment.", primary: "Record cost", secondary: "View margin", icon: Cloud, contract: "GET /api/v1/admin/business/infrastructure-costs", checkpoints: ["Cost per workspace", "Cost per project", "Cost per deployment", "Gross margin"] },
  "admin-business-reports": { eyebrow: "Business", title: "Business report exports", description: "Generate executive, finance, billing, support, marketplace, security, deployment, AI usage, and developer reports as PDF, CSV, or Excel-ready exports.", primary: "Generate report", secondary: "Download latest", icon: FileText, contract: "POST /api/v1/admin/business/reports", checkpoints: ["PDF", "CSV", "Excel", "Audit"] },
  "admin-engineering": { eyebrow: "Engineering", title: "Engineering operations", description: "Operate repository health, active projects, build queue, agent jobs, CI status, deployment queue, debt, coverage, bugs, security findings, architecture violations, database, queues, and providers from backend evidence.", primary: "Refresh dashboard", secondary: "Generate report", icon: Code2, contract: "GET /api/v1/admin/engineering", checkpoints: ["Repository health", "CI", "Debt", "Provider health"] },
  "admin-engineering-projects": { eyebrow: "Engineering", title: "Project governance", description: "Track owners, tech leads, product owners, priority, status, architecture version, release version, docs status, security status, risk, completion, dependencies, and debt score.", primary: "Register project", secondary: "Review risk", icon: FolderOpen, contract: "POST /api/v1/admin/engineering/projects", checkpoints: ["Owner", "Tech lead", "Risk score", "Debt score"] },
  "admin-engineering-architecture": { eyebrow: "Architecture", title: "Architecture governance", description: "Manage ADRs, architecture reviews, versioning, approvals, change requests, and compliance reports with auditable approval history.", primary: "Create ADR", secondary: "Request review", icon: GitBranch, contract: "POST /api/v1/admin/engineering/architecture/adr", checkpoints: ["ADR", "Review", "Approval", "Compliance"] },
  "admin-engineering-quality": { eyebrow: "Quality", title: "Code quality center", description: "Review lint, type errors, coverage, duplicated code, unused files, unused packages, unused APIs, complexity, large files, and large functions from validation and metric records.", primary: "Review findings", secondary: "Assign owner", icon: ShieldCheck, contract: "GET /api/v1/admin/engineering/quality", checkpoints: ["Lint", "Types", "Coverage", "Complexity"] },
  "admin-engineering-debt": { eyebrow: "Debt", title: "Technical debt register", description: "Create and manage debt items with priority, owner, impact, effort, related project, status, risk, and target sprint.", primary: "Create debt item", secondary: "View critical", icon: ClipboardCheck, contract: "POST /api/v1/admin/engineering/technical-debt", checkpoints: ["Priority", "Owner", "Risk", "Target sprint"] },
  "admin-engineering-releases": { eyebrow: "Release", title: "Release pipeline", description: "Track development, internal QA, security review, release candidate, beta, GA, hotfix, patch, and LTS with rollback plans and validation evidence.", primary: "Create gate", secondary: "Approve stage", icon: Rocket, contract: "POST /api/v1/admin/engineering/release-pipeline", checkpoints: ["Approval", "Rollback", "Validation", "Migration notes"] },
  "admin-engineering-environments": { eyebrow: "Environments", title: "Environment management", description: "Manage development, testing, staging, production, sandbox, and preview health across secrets, providers, database, storage, queues, workers, and deployments.", primary: "Register environment", secondary: "Record health", icon: Cloud, contract: "POST /api/v1/admin/engineering/environments", checkpoints: ["Secrets", "Database", "Queues", "Workers"] },
  "admin-engineering-database": { eyebrow: "Database", title: "Database governance", description: "Track schema versions, migration history, rollback history, index health, query performance, unused tables, unused columns, and storage growth.", primary: "Record migration", secondary: "Add DB metric", icon: Database, contract: "GET /api/v1/admin/engineering/database", checkpoints: ["Schema", "Migrations", "Indexes", "Storage"] },
  "admin-engineering-analytics": { eyebrow: "Analytics", title: "Engineering analytics", description: "Measure lead time, cycle time, deployment frequency, change failure rate, recovery time, build success, review time, merge time, and bug resolution.", primary: "View trends", secondary: "Export report", icon: BarChart3, contract: "GET /api/v1/admin/engineering/analytics", checkpoints: ["Lead time", "Cycle time", "Failure rate", "Recovery"] },
  "admin-engineering-governance": { eyebrow: "Governance", title: "Platform governance", description: "Review API, documentation, design system, database, agent, marketplace, and SDK versioning from real platform records.", primary: "Review versions", secondary: "Open reports", icon: Box, contract: "GET /api/v1/admin/engineering/governance", checkpoints: ["API versions", "DB versions", "Agent versions", "SDK versions"] },
  "admin-engineering-admin-tools": { eyebrow: "Admin tools", title: "Engineering admin tools", description: "Control feature flags, maintenance windows, announcements, emergency lock, read-only mode, provider switching, queue control, and cache configuration with audited actions.", primary: "Create flag", secondary: "Review controls", icon: Settings, contract: "POST /api/v1/admin/engineering/feature-flags", checkpoints: ["Flags", "Maintenance", "Queue control", "Audit"] },
  "admin-intelligence": { eyebrow: "Intelligence", title: "Platform intelligence center", description: "Review executive, product, engineering, AI, customer, billing, infrastructure, security, marketplace, and support health with evidence-backed suggested actions.", primary: "Generate scores", secondary: "Run inspection", icon: Sparkles, contract: "GET /api/v1/admin/intelligence", checkpoints: ["Evidence", "Reason", "Trend", "Suggested action"] },
  "admin-intelligence-health": { eyebrow: "Intelligence", title: "Health scoring engine", description: "Generate deterministic 0-100 scores for workspaces, projects, deployments, agents, billing, marketplace, support, developer, security, and infrastructure.", primary: "Generate health", secondary: "View history", icon: ShieldCheck, contract: "POST /api/v1/admin/intelligence/health-scores/generate", checkpoints: ["Score", "Reason", "Evidence", "Owner"] },
  "admin-intelligence-self-heal": { eyebrow: "Intelligence", title: "Self-healing engine", description: "Detect failed jobs, queue backlog, retry-safe failures, workers, provider gaps, broken webhooks, failed deployments, expired API keys, and failed emails.", primary: "Run self-heal", secondary: "Review approvals", icon: Hammer, contract: "POST /api/v1/admin/intelligence/self-heal", checkpoints: ["Safe repairs", "Approval required", "Timeline", "Audit"] },
  "admin-intelligence-predictions": { eyebrow: "Intelligence", title: "Prediction engine", description: "Forecast low credits, storage exhaustion, renewal risk, churn, deployment risk, overload, provider impact, queue saturation, database growth, and project delay using transparent heuristics.", primary: "View predictions", secondary: "Open evidence", icon: BarChart3, contract: "GET /api/v1/admin/intelligence/predictions", checkpoints: ["Risk", "Confidence", "Horizon", "Evidence"] },
  "admin-intelligence-recommendations": { eyebrow: "Intelligence", title: "Recommendation engine", description: "Recommend upgrades, storage optimization, archival, API key rotation, team invites, MFA/security review, documentation, onboarding, and AI cost reduction with evidence.", primary: "Review actions", secondary: "Export", icon: ClipboardCheck, contract: "GET /api/v1/admin/intelligence/recommendations", checkpoints: ["Priority", "Reason", "Evidence", "Owner"] },
  "admin-intelligence-inspections": { eyebrow: "Intelligence", title: "Automated inspections", description: "Run daily, weekly, or monthly inspections for unused API keys, inactive workspaces, expired webhooks, large files, growth, failed jobs, security warnings, docs, and bugs.", primary: "Run inspection", secondary: "View results", icon: Search, contract: "POST /api/v1/admin/intelligence/inspections/run", checkpoints: ["Cadence", "Results", "Warnings", "Next action"] },
  "admin-intelligence-reports": { eyebrow: "Intelligence", title: "Intelligence reports", description: "Generate executive, engineering, workspace, project, billing, security, infrastructure, customer success, marketplace, and support reports as PDF, CSV, or Excel-ready exports.", primary: "Generate report", secondary: "View exports", icon: FileText, contract: "POST /api/v1/admin/intelligence/reports", checkpoints: ["PDF", "CSV", "Excel", "Audit"] },
  feedback: { eyebrow: "Feedback", title: "Feedback loop", description: "Collect customer bug reports, feature requests, UX issues, billing issues, documentation issues, and integration requests linked to workspace context.", primary: "Submit feedback", secondary: "View roadmap", icon: MessageSquare, contract: "POST /api/v1/feedback", checkpoints: ["User link", "Workspace link", "Status", "Votes"] },
  "feedback-feature-requests": { eyebrow: "Feedback", title: "Feature requests", description: "Review customer feature requests without fake votes or static roadmap data.", primary: "Vote", secondary: "Track status", icon: Sparkles, contract: "GET /api/v1/feedback", checkpoints: ["Votes", "Status", "Triage", "Roadmap"] },
  "feedback-bug-reports": { eyebrow: "Feedback", title: "Bug reports", description: "Capture product bugs with safe details and support traceability.", primary: "Report bug", secondary: "Open support", icon: Shield, contract: "POST /api/v1/feedback", checkpoints: ["Type", "Workspace", "Status", "Admin triage"] },
  "feedback-roadmap": { eyebrow: "Feedback", title: "Customer roadmap", description: "Show planned and shipped feedback items from real triaged feedback records.", primary: "View planned", secondary: "Submit idea", icon: GitBranch, contract: "GET /api/v1/feedback", checkpoints: ["Planned", "In progress", "Shipped", "Closed"] },
  "project-detail": { eyebrow: "Project", title: "Project command center", description: "One place to review the idea, approvals, active agent work, files, QA, deployment, release, docs, and memory.", primary: "Open chat", secondary: "Review blueprint", icon: FolderOpen, contract: "GET /api/v1/projects/:projectId", checkpoints: ["Requirement state", "Approval gates", "Latest run", "Next action"] },
  "project-chat": { eyebrow: "Conversation", title: "Requirement conversation", description: "ChatGPT-style project conversation linked to the project, agent run, blueprint, usage, and audit history.", primary: "Ask follow-up", secondary: "Generate questions", icon: MessageSquare, contract: "POST /api/v1/factory/projects/:projectId/questions/answer", checkpoints: ["Natural-language idea", "Follow-up questions", "Decision explanations", "Change requests"] },
  "project-intake": { eyebrow: "Intake", title: "Guided requirement intake", description: "Capture product type, platform, roles, features, integrations, complexity, budget, and deployment target.", primary: "Save intake", secondary: "Analyze quality", icon: ClipboardCheck, contract: "POST /api/v1/factory/projects/:projectId/intake", checkpoints: ["Required fields", "Optional context", "Prompt-injection scan", "Usage limit check"] },
  "project-questions": { eyebrow: "Requirements", title: "Smart follow-up questions", description: "The Requirement Agent detects missing details and asks only the questions needed to raise blueprint confidence.", primary: "Answer questions", secondary: "Regenerate", icon: Sparkles, contract: "POST /api/v1/factory/projects/:projectId/questions/generate", checkpoints: ["Missing fields", "Quality score", "Complexity estimate", "Next action"] },
  "project-blueprint": { eyebrow: "Blueprint", title: "PRD and system blueprint", description: "Review PRD, feature list, journeys, API map, database schema, security plan, testing plan, and deployment plan before build.", primary: "Approve blueprint", secondary: "Request changes", icon: FileText, contract: "POST /api/v1/factory/projects/:projectId/blueprints/:blueprintId/approve", checkpoints: ["Human approval", "Version history", "Proof record", "Audit log"] },
  "project-design": { eyebrow: "Design", title: "AI Design Studio", description: "Review layout direction, design tokens, component map, responsive strategy, accessibility checklist, and UI quality score.", primary: "Approve design", secondary: "Revise direction", icon: LayoutDashboard, contract: "POST /api/v1/factory/projects/:projectId/design/generate", checkpoints: ["Design system", "Responsive states", "Accessibility", "Approval gate"] },
  "project-tasks": { eyebrow: "Engineering", title: "Executable task graph", description: "Blueprint output becomes dependency-aware tasks with owners, status, priority, due date, audit history, and next action.", primary: "Generate task graph", secondary: "Assign owner", icon: GitBranch, contract: "POST /api/v1/factory/projects/:projectId/task-graph/generate", checkpoints: ["Dependencies", "Owners", "Blocked states", "Handoffs"] },
  "project-agents": { eyebrow: "Agents", title: "Multi-agent execution", description: "Requirement, Product, Architect, UX, Backend, Frontend, QA, Security, Deployment, Documentation, and Reviewer agents work through structured handoffs.", primary: "Start agent run", secondary: "View roles", icon: Cpu, contract: "POST /api/v1/agents/runs", checkpoints: ["Agent brain", "Structured output", "Confidence", "Cost tracking"] },
  "project-files": { eyebrow: "Code", title: "Generated files", description: "Track every generated file, version, owner, diff, status, repair attempt, and human approval requirement.", primary: "Review files", secondary: "Open diffs", icon: Code2, contract: "GET /api/v1/factory/projects/:projectId/files", checkpoints: ["File versions", "No silent overwrite", "Review status", "Repair links"] },
  "project-diffs": { eyebrow: "Review", title: "Diff review", description: "Approve, reject, or request regeneration for file changes before they affect protected or human-edited code.", primary: "Approve selected", secondary: "Reject changes", icon: GitBranch, contract: "GET /api/v1/factory/projects/:projectId/diffs", checkpoints: ["Old vs new", "Changed lines", "Human review", "Audit trail"] },
  "project-qa": { eyebrow: "QA", title: "Validation factory", description: "Run lint, type-check, unit, integration, E2E, API smoke, route security, build, and production readiness checks.", primary: "Run QA", secondary: "View failures", icon: ShieldCheck, contract: "POST /api/v1/factory/projects/:projectId/qa/run", checkpoints: ["Validation evidence", "Error source", "Repair cycle", "Final status"] },
  "project-security": { eyebrow: "Security", title: "Security review", description: "Review auth, permissions, tenant isolation, input validation, output sanitization, dependencies, prompt injection, and secret exposure.", primary: "Run security review", secondary: "Open findings", icon: Shield, contract: "POST /api/v1/factory/projects/:projectId/security/review", checkpoints: ["RBAC", "Tenant boundary", "Secrets", "Prompt injection"] },
  "project-deployment": { eyebrow: "Deployment", title: "Deployment manager", description: "Prepare release, run readiness checks, migrations, build verification, health checks, release history, and rollback metadata.", primary: "Prepare deployment", secondary: "Verify health", icon: Rocket, contract: "POST /api/v1/deployments", checkpoints: ["Readiness", "Release ID", "Rollback", "Health checks"] },
  "project-release": { eyebrow: "Release", title: "Release manager", description: "Create version, changelog, release notes, deployment checklist, rollback plan, production approval, and final report.", primary: "Prepare release", secondary: "Approve release", icon: BadgeIcon, contract: "POST /api/v1/factory/projects/:projectId/release/prepare", checkpoints: ["Version", "Changelog", "Known issues", "Approval"] },
  "project-docs": { eyebrow: "Docs", title: "Generated documentation", description: "Produce setup guide, README, API docs, release notes, operations notes, and maintenance plan for every project.", primary: "Open docs", secondary: "Regenerate", icon: FileText, contract: "GET /api/v1/factory/projects/:projectId/docs", checkpoints: ["README", "API reference", "Setup", "Maintenance"] },
  "project-memory": { eyebrow: "Memory", title: "Project memory", description: "Store approved patterns, rejected outputs, fixes, preferences, and deployment lessons without retaining secrets or sensitive data unnecessarily.", primary: "Search memory", secondary: "Review entries", icon: Database, contract: "POST /api/v1/knowledge/search", checkpoints: ["Source", "Confidence", "Review", "Retention"] },
  billing: { eyebrow: "Billing", title: "Billing dashboard", description: "View plan, usage limits, credits, invoices, payment history, subscription state, and upgrade gates from backend truth.", primary: "View plans", secondary: "Open invoices", icon: CreditCard, contract: "GET /api/v1/billing/usage", checkpoints: ["Plan limits", "Credit wallet", "Invoices", "Server-side gates"] },
  "billing-checkout": { eyebrow: "Checkout", title: "Secure checkout", description: "Start Razorpay checkout with server-side pricing validation, GST-ready invoices, signature verification, and idempotent webhooks.", primary: "Continue checkout", secondary: "Compare plans", icon: Lock, contract: "POST /api/v1/billing/checkout", checkpoints: ["Signature", "Idempotency", "GST invoice", "Audit log"] },
  "billing-result": { eyebrow: "Payment", title: "Payment status", description: "Confirm successful payments or show clear recovery actions for failed payments without fake success states.", primary: "View subscription", secondary: "Retry payment", icon: CheckCircle2, contract: "POST /api/v1/webhooks/razorpay", checkpoints: ["Webhook verified", "Payment linked", "Invoice", "Credits"] },
  "billing-subscription": { eyebrow: "Subscription", title: "Subscription management", description: "Upgrade, downgrade, cancel, renew, and manage failed-payment grace periods with audit coverage.", primary: "Manage subscription", secondary: "Cancel plan", icon: CreditCard, contract: "GET /api/v1/billing/subscription", checkpoints: ["Lifecycle", "Proration", "Renewal", "Grace period"] },
  "billing-invoices": { eyebrow: "Invoices", title: "Invoice history", description: "Download invoices linked to subscriptions, payments, GST details, and audit-safe billing records.", primary: "Download latest", secondary: "Filter invoices", icon: FileText, contract: "GET /api/v1/billing/invoices", checkpoints: ["Payment link", "GST", "Status", "Download"] },
  "billing-usage": { eyebrow: "Usage", title: "Usage and limits", description: "Track projects, AI credits, storage, deployments, templates, users, API access, and upgrade requirements.", primary: "View limits", secondary: "Upgrade", icon: BarChart3, contract: "GET /api/v1/billing/usage", checkpoints: ["Meters", "Forecast", "Upgrade CTA", "Limit events"] },
  "billing-credits": { eyebrow: "Credits", title: "Credit wallet", description: "Top up credits, review deductions, refunds, failed-run credits, and transaction history.", primary: "Top up credits", secondary: "View transactions", icon: CreditCard, contract: "GET /api/v1/billing/credits", checkpoints: ["Balance", "Deductions", "Refunds", "Transactions"] },
  marketplace: { eyebrow: "Marketplace", title: "KRAVIA app marketplace", description: "Browse reviewed apps, plugins, templates, agent extensions, automations, and integrations with permission consent.", primary: "Browse apps", secondary: "Installed apps", icon: Store, contract: "GET /api/v1/marketplace/apps", checkpoints: ["Review status", "Permissions", "Pricing", "Install"] },
  "marketplace-detail": { eyebrow: "Marketplace", title: "App detail and consent", description: "Review app version, publisher, requested permissions, pricing, security review, and install impact before enabling.", primary: "Install app", secondary: "Review permissions", icon: Store, contract: "POST /api/v1/marketplace/apps/:appId/install", checkpoints: ["Consent", "Version", "Publisher", "Rollback"] },
  "marketplace-installed": { eyebrow: "Marketplace", title: "Installed apps", description: "Manage workspace apps, updates, rollbacks, uninstall actions, and permission changes.", primary: "Review installed", secondary: "Open marketplace", icon: Box, contract: "GET /api/v1/marketplace/installs", checkpoints: ["Workspace isolation", "Permissions", "Updates", "Uninstall"] },
  developers: { eyebrow: "Developers", title: "Developer platform", description: "Manage apps, API keys, webhooks, documentation, usage analytics, and plugin extensions.", primary: "Create app", secondary: "Read docs", icon: Code2, contract: "GET /api/v1/developer/apps", checkpoints: ["OAuth-ready apps", "Hashed keys", "Signed webhooks", "Usage logs"] },
  "developer-apps": { eyebrow: "Developers", title: "Developer apps", description: "Register OAuth-ready apps with scopes, redirect URLs, owners, and audit logs.", primary: "New app", secondary: "View apps", icon: Box, contract: "POST /api/v1/developer/apps", checkpoints: ["Scopes", "Owners", "Rotation", "Audit"] },
  "developer-api-keys": { eyebrow: "Developers", title: "API key management", description: "Create, rotate, revoke, and audit hashed API keys without exposing secrets after creation.", primary: "Create key", secondary: "Revoke old", icon: KeyRound, contract: "POST /api/v1/developer/api-keys", checkpoints: ["Hash at rest", "One-time reveal", "Revoke", "Rate limits"] },
  "developer-webhooks": { eyebrow: "Developers", title: "Webhook endpoints", description: "Configure signed webhook endpoints, retries, replay protection, event filters, and delivery logs.", primary: "Add endpoint", secondary: "Send test", icon: Webhook, contract: "POST /api/v1/developer/webhooks", checkpoints: ["Signing", "Retries", "Replay", "Delivery logs"] },
  "developer-docs": { eyebrow: "Developers", title: "API and SDK docs", description: "Use versioned APIs, SDK metadata, CLI workflows, plugin guides, and webhook references.", primary: "Open API docs", secondary: "Download SDK", icon: FileText, contract: "GET /api/v1/developers/docs", checkpoints: ["Versioned API", "SDKs", "CLI", "Examples"] },
  "developer-usage": { eyebrow: "Developers", title: "API usage analytics", description: "Track request volume, latency, errors, rate limits, and app-level usage by workspace.", primary: "View metrics", secondary: "Export logs", icon: BarChart3, contract: "GET /api/v1/developers/usage", checkpoints: ["Request logs", "Latency", "Errors", "Rate limits"] },
  admin: { eyebrow: "Admin", title: "Admin command center", description: "Operate factory, agents, billing, marketplace, operations, audit, security, and platform settings.", primary: "Review operations", secondary: "Open audit", icon: LayoutDashboard, contract: "GET /api/v1/admin/factory", checkpoints: ["RBAC", "Audit", "Approvals", "Health"] },
  "admin-agents": { eyebrow: "Admin", title: "Agent governance", description: "Manage agent roles, brains, tool permissions, handoffs, reviews, and final reviewer approvals.", primary: "View agents", secondary: "Review brains", icon: Cpu, contract: "GET /api/v1/agents/roles", checkpoints: ["Role prompts", "Schemas", "Tools", "Handoffs"] },
  "admin-billing": { eyebrow: "Admin", title: "Billing operations", description: "Manage plans, subscriptions, payments, invoices, usage limits, credits, and billing audit events.", primary: "Manage plans", secondary: "Review payments", icon: CreditCard, contract: "GET /api/v1/admin/billing/plans", checkpoints: ["Pricing source", "Overrides", "Invoices", "Webhooks"] },
  "admin-marketplace": { eyebrow: "Admin", title: "Marketplace review", description: "Review submissions, security scans, publisher trust, permissions, pricing, payouts, and public listing approval.", primary: "Review apps", secondary: "Open publishers", icon: Store, contract: "GET /api/v1/admin/marketplace/reviews", checkpoints: ["Security review", "Permissions", "Publisher", "Versioning"] },
  "admin-operations": { eyebrow: "Admin", title: "Operations center", description: "Monitor health, queues, workers, incidents, deployments, maintenance mode, and emergency controls.", primary: "Open health", secondary: "Review incidents", icon: BarChart3, contract: "GET /api/v1/operations/health", checkpoints: ["Health", "Queues", "Incidents", "Emergency controls"] },
  "admin-audit": { eyebrow: "Admin", title: "Audit center", description: "Search admin actions, approvals, deployments, rollbacks, logins, permissions, billing, and API key events.", primary: "Search audit", secondary: "Export", icon: FileText, contract: "GET /api/v1/audit-logs", checkpoints: ["Actor", "Target", "Outcome", "Correlation ID"] },
  "admin-audit-exports": { eyebrow: "Admin", title: "Audit exports", description: "Create CSV or JSON exports for enterprise audit review with filters, record counts, and export history.", primary: "Export audit", secondary: "View history", icon: FileText, contract: "POST /api/v1/audit-logs/export", checkpoints: ["CSV", "JSON", "Filters", "Audit trail"] },
  "admin-security": { eyebrow: "Admin", title: "Security dashboard", description: "Review RBAC, tenant isolation, webhook protection, secret masking, abuse prevention, and prompt-injection events.", primary: "Run report", secondary: "View events", icon: Shield, contract: "GET /api/v1/admin/security/overview", checkpoints: ["RBAC", "Tenant isolation", "Secrets", "Threats"] },
  "admin-security-events": { eyebrow: "Security", title: "Security events", description: "Review suspicious logins, API-key abuse, webhook replay, prompt-risk events, secret findings, provider failures, and admin actions.", primary: "Review events", secondary: "Generate report", icon: Shield, contract: "GET /api/v1/admin/security/events", checkpoints: ["Severity", "Evidence", "Status", "Next action"] },
  "admin-security-risk": { eyebrow: "Security", title: "Risk scoring", description: "View deterministic readiness scores for sessions, API keys, prompts, secrets, audit posture, providers, and tenant controls.", primary: "Refresh risk", secondary: "Open reports", icon: ShieldCheck, contract: "GET /api/v1/admin/security/risk", checkpoints: ["Signals", "Score", "Level", "Recovery"] },
  "admin-security-sessions": { eyebrow: "Security", title: "Session security", description: "Inspect login history, failed attempts, session evidence, user agent, IP metadata, and suspicious access signals.", primary: "Review sessions", secondary: "Open audit", icon: User, contract: "GET /api/v1/admin/security/sessions", checkpoints: ["Login outcome", "IP", "User agent", "Risk"] },
  "admin-security-api-keys": { eyebrow: "Security", title: "API key security", description: "Review key status, scopes, IP allowlists, replay protection, rate limits, and abuse indicators without exposing secrets.", primary: "Review keys", secondary: "Revoke key", icon: KeyRound, contract: "GET /api/v1/admin/security/api-keys", checkpoints: ["Scopes", "IP allowlist", "Status", "No secret exposure"] },
  "admin-security-reports": { eyebrow: "Security", title: "Enterprise security reports", description: "Generate evidence-backed readiness reports for posture, audit summary, API-key risk, providers, tenant isolation, and billing security.", primary: "Generate report", secondary: "View reports", icon: FileText, contract: "POST /api/v1/admin/security/reports/generate", checkpoints: ["Readiness", "Evidence", "No certification claim", "Audit log"] },
  "admin-privacy": { eyebrow: "Privacy", title: "Privacy review center", description: "Review data export and deletion requests with status, due date, activity history, and admin decision audit trail.", primary: "Review requests", secondary: "Open policy logs", icon: Lock, contract: "GET /api/v1/admin/privacy/delete-requests", checkpoints: ["Export requests", "Delete requests", "Review", "Audit"] },
  "settings-security": { eyebrow: "Settings", title: "Security settings", description: "Manage account and workspace security preferences, session policy, MFA readiness, and admin strict mode.", primary: "Save security", secondary: "View sessions", icon: Shield, contract: "PATCH /api/v1/settings/security", checkpoints: ["Session policy", "MFA ready", "Audit", "Recovery"] },
  "settings-data-privacy": { eyebrow: "Settings", title: "Data and privacy", description: "Request data exports or deletion review with clear status, due date, activity history, and safe recovery path.", primary: "Request export", secondary: "Request deletion", icon: Lock, contract: "POST /api/v1/settings/data-privacy/export", checkpoints: ["Export", "Delete request", "Retention", "Audit"] },
  "developer-api-key-security": { eyebrow: "Developers", title: "API key security controls", description: "Configure scopes, IP allowlists, replay protection, per-minute limit, and revoke flow for a developer API key.", primary: "Save controls", secondary: "Revoke key", icon: KeyRound, contract: "PATCH /api/v1/developer/api-keys/:keyId/security", checkpoints: ["Scopes", "Allowlist", "Replay protection", "Revoke"] },
  "admin-settings": { eyebrow: "Admin", title: "Platform settings", description: "Configure approval gates, overwrite policy, memory retention, deployment controls, notification policies, and security defaults.", primary: "Save settings", secondary: "Review policy", icon: Settings, contract: "GET /api/v1/admin/factory/settings", checkpoints: ["Approval gates", "Retention", "Policies", "Defaults"] }
};

function BadgeIcon(props: { size?: number; className?: string }) {
  return <CheckCircle2 {...props} />;
}

function SurfacePage({ route, navigate }: { route: string; navigate: (route: string) => void }) {
  const page = SURFACE_PAGES[route] || SURFACE_PAGES["project-detail"];
  const Icon = page.icon;
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary">{page.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{page.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{page.description}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">{page.primary}</button>
            {page.secondary && <button className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">{page.secondary}</button>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Backend contract</h2>
                <p className="mt-1 font-mono text-xs text-primary">{page.contract}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">This screen is wired as a real workflow surface. Connect its actions to the listed API contract with authenticated requests, permission checks, usage-limit enforcement, and audit logging.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">State model</h2>
            <div className="mt-4 space-y-2">
              {["Loading", "Empty", "Error", "Permission denied", "Plan limit", "Success"].map((state) => (
                <div key={state} className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                  <span>{state}</span>
                  <CheckCircle2 size={13} className="text-primary" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Production checklist</h2>
                <p className="mt-1 text-xs text-muted-foreground">What must be present before this workflow can be marked complete.</p>
              </div>
              <button onClick={() => navigate("docs")} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">Open docs</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {page.checkpoints.map((checkpoint) => (
                <div key={checkpoint} className="rounded-xl border border-border bg-background p-4">
                  <CheckCircle2 size={14} className="mb-3 text-primary" />
                  <div className="text-sm font-medium text-foreground">{checkpoint}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
function ProductFooter({ navigate }: { navigate: (route: string) => void }) {
  const links = [
    ["terms", "Terms"],
    ["privacy", "Privacy"],
    ["cookies", "Cookies"],
    ["acceptable-use", "Acceptable Use"],
    ["security-page", "Security"],
    ["support", "Support"],
  ];
  return (
    <footer className="shrink-0 border-t border-border bg-card/70 px-3 py-2">
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Mark size={13} className="text-primary" />
          <span>VaanForge</span>
          <span className="hidden sm:inline">Built for production software teams.</span>
        </div>
        <nav className="flex flex-wrap gap-x-3 gap-y-1">
          {links.map(([routeId, label]) => (
            <button key={routeId} onClick={() => navigate(routeId)} className="hover:text-foreground transition-colors">
              {label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
export function WorkspaceApp({ route, navigate, dark, toggleTheme }: PageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(1);

  // Collapse sidebar on small screens by default
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    if (mq.matches) setSidebarOpen(false);
  }, []);

  const content = () => {
    if (SURFACE_PAGES[route]) return <SurfacePage route={route} navigate={navigate} />;
    if (route === "projects")    return <ProjectsView />;
    if (route === "builds")      return <BuildsView />;
    if (route === "pricing")     return <PricingView />;
    if (route === "profile")     return <ProfileView navigate={navigate} />;
    if (route === "settings")    return <SettingsView />;
    if (route === "factory")     return <PlaceholderView title="Factory" icon={Cpu} />;
    if (route === "validations") return <PlaceholderView title="Validations" icon={ShieldCheck} />;
    if (route === "deployments") return <PlaceholderView title="Deployments" icon={Rocket} />;
    return <WorkspaceDashboard />;
  };

  return (
    /* Fixed full-viewport shell â€” no page scroll */
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      <TopNav route={route} navigate={navigate} dark={dark} toggleTheme={toggleTheme} onMobileMenu={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block h-full">
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} activeChat={activeChat} setActiveChat={setActiveChat} navigate={navigate} />
        </div>

        {/* Mobile sidebar drawer */}
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} activeChat={activeChat} setActiveChat={setActiveChat} navigate={navigate} />

        {/* Main content â€” takes remaining space, no outer scroll */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {content()}
          <ProductFooter navigate={navigate} />
        </div>
      </div>
    </div>
  );
}










