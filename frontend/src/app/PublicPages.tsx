import React, { useState } from "react";
import {
  ArrowRight, CheckCircle2, ChevronRight,
  Mail, Search, Shield, Cpu,
  Users, Globe, Lock, Activity, FileText, BookOpen,
  HelpCircle, Plus,
  CheckSquare, GitMerge, Rocket, Star,
  ShieldCheck, CreditCard,
} from "lucide-react";
import type { PageProps } from "./App";

// â”€â”€ Logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Mark = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
    <path d="M5 5L16 26L27 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="26" r="2.5" fill="currentColor" />
    <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
    <circle cx="27" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
  </svg>
);

// â”€â”€ Public top nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PublicNav({ navigate }: { navigate: (r: string) => void }) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 gap-6 sticky top-0 z-40">
      <button onClick={() => navigate("workspace")} className="flex items-center gap-2 text-primary shrink-0">
        <Mark size={18} />
        <span className="text-sm tracking-tight leading-none">
          <span className="font-semibold">Vaan</span>
          <span className="font-light opacity-70">Forge</span>
        </span>
      </button>
      <nav className="hidden md:flex items-center gap-0.5 text-sm flex-1">
        {[["about", "About"], ["docs", "Docs"], ["help", "Help"], ["changelog", "Changelog"], ["status", "Status"]].map(([r, l]) => (
          <button key={r} onClick={() => navigate(r)} className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs">
            {l}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => navigate("legal")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors hidden sm:block">Legal</button>
        <button onClick={() => navigate("contact")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">Contact</button>
        <button onClick={() => navigate("workspace")} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 flex items-center gap-1">
          Open App <ArrowRight size={11} />
        </button>
      </div>
    </header>
  );
}

// â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PublicFooter({ navigate }: { navigate: (r: string) => void }) {
  return (
    <footer className="border-t border-border mt-20 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {[
            { heading: "Product", links: [["workspace", "Workspace"], ["pricing", "Pricing"], ["changelog", "Changelog"], ["roadmap", "Roadmap"]] },
            { heading: "Company", links: [["about", "About"], ["contact", "Contact"], ["trust", "Trust Center"], ["status", "Status"]] },
            { heading: "Resources", links: [["docs", "Documentation"], ["help", "Help Center"], ["support", "Support"], ["accessibility", "Accessibility"]] },
            { heading: "Legal", links: [["terms", "Terms"], ["privacy", "Privacy"], ["cookies", "Cookies"], ["legal", "Legal Hub"]] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">{heading}</div>
              <ul className="space-y-2">
                {links.map(([r, l]) => (
                  <li key={r}>
                    <button onClick={() => navigate(r)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-primary">
            <Mark size={14} />
            <span className="text-xs"><span className="font-semibold">Vaan</span><span className="font-light opacity-70">Forge</span></span>
          </div>
          <div className="text-xs text-muted-foreground">Â© 2025 VaanForge. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

// â”€â”€ Layout wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PublicLayout({ navigate, children }: { navigate: (r: string) => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav navigate={navigate} />
      <main>{children}</main>
      <PublicFooter navigate={navigate} />
    </div>
  );
}

// â”€â”€ Shared prose section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PageHero({ tag, title, sub }: { tag?: string; title: string; sub?: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-10">
      {tag && <div className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{tag}</div>}
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
      {sub && <p className="text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">{sub}</p>}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABOUT PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AboutPage({ navigate }: { navigate: (r: string) => void }) {
  const principles = [
    { icon: Shield, title: "Clarity", desc: "Every output is explained. No black-box decisions. Users always know what the agent built and why." },
    { icon: Lock, title: "Control", desc: "Nothing deploys without explicit human approval at every stage â€” requirements, blueprint, build, and deployment." },
    { icon: CheckSquare, title: "Accountability", desc: "Full audit trail from first prompt to production. Every decision is logged, versioned, and reviewable." },
    { icon: ShieldCheck, title: "Validation", desc: "Automated QA, security scanning, and deployment readiness checks run before any output is shown to the user." },
    { icon: Rocket, title: "Deployment Safety", desc: "VaanForge won't ship code it cannot validate. Security gates block deployments that fail checks." },
    { icon: GitMerge, title: "Maintainability", desc: "All generated code follows consistent conventions with documentation so your team can own and modify it." },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero
        tag="About VaanForge"
        title="An AI factory that builds software responsibly."
        sub="VaanForge is an enterprise AI workspace that turns your software requirements into validated, production-ready code â€” with humans in control at every step."
      />
      <div className="max-w-5xl mx-auto px-6 space-y-16 pb-16">
        {/* What it is */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">What VaanForge is</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>VaanForge is not a code generator. It is an enterprise-grade AI Software Factory â€” a structured, multi-stage pipeline that takes your software idea from conversation to production-ready release package.</p>
              <p>The agent detects missing requirements, asks smart follow-up questions, generates a human-reviewable blueprint, builds all modules in parallel, runs automated QA and security validation, and delivers documented, deployable code.</p>
              <p>At no point does VaanForge ship anything without your explicit approval.</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Why it exists</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>Most AI coding tools generate code quickly but skip the hard parts: requirements clarity, architecture review, security validation, and deployment readiness.</p>
              <p>VaanForge was built for teams that need software they can actually ship, maintain, and explain to stakeholders â€” not just code that passes a surface-level test.</p>
              <p>The result is a product that builds slower than a raw AI chat tool, but produces outputs that are dramatically more reliable and ownership-ready.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">How the AI Software Factory works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Requirements", desc: "The agent interviews you to clarify all requirements before writing a single line of code." },
              { n: "02", title: "Blueprint", desc: "A complete architecture is generated and presented for your review and approval." },
              { n: "03", title: "Build", desc: "Modules are built in parallel. Every build is versioned, tested, and logged." },
              { n: "04", title: "Validate & Ship", desc: "QA, security, and deployment checks run automatically before any output is released." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-card border border-border rounded-xl p-5">
                <div className="text-xs font-mono text-primary mb-3">{n}</div>
                <div className="text-sm font-semibold text-foreground mb-2">{title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Product principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon size={15} className="text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-1.5">{title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Ready to build your first project?</h3>
            <p className="text-sm text-muted-foreground mt-1">Start with the Free plan â€” 1 project, no credit card required.</p>
          </div>
          <button onClick={() => navigate("workspace")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 text-sm shrink-0">
            Open Workspace <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTACT PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function ContactPage({ navigate }: { navigate: (r: string) => void }) {
  const [type, setType] = useState("general");
  const [sent, setSent] = useState(false);

  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Contact" title="Get in touch." sub="We respond to all inquiries within 1 business day. Enterprise and security inquiries are prioritized." />
      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-primary" />
                </div>
                <div className="font-semibold text-foreground">Message sent</div>
                <p className="text-sm text-muted-foreground max-w-xs">We've received your message and will reply to your email within 1 business day.</p>
                <button onClick={() => setSent(false)} className="text-xs text-primary hover:underline">Send another message</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
                    <input required className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" placeholder="Arjun Sharma" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Work email</label>
                    <input required type="email" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" placeholder="arjun@company.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Company</label>
                  <input className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" placeholder="Company name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Inquiry type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors">
                    <option value="general">General inquiry</option>
                    <option value="sales">Sales / Enterprise</option>
                    <option value="support">Technical support</option>
                    <option value="billing">Billing</option>
                    <option value="security">Security disclosure</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Message</label>
                  <textarea required rows={5} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors resize-none" placeholder="Describe your question or inquiry in detailâ€¦" />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5" />
                  <span className="text-xs text-muted-foreground">I agree to VaanForge&apos;s <button type="button" onClick={() => navigate("privacy")} className="text-primary hover:underline">Privacy Policy</button> and consent to being contacted.</span>
                </label>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 flex items-center justify-center gap-2">
                  Send Message <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { icon: Mail, title: "Email", desc: "For general inquiries and support", contact: "hello@vaanforge.io" },
            { icon: Shield, title: "Security", desc: "Responsible disclosure", contact: "security@vaanforge.io" },
            { icon: Users, title: "Enterprise Sales", desc: "Plans, demos, and contracts", contact: "sales@vaanforge.io" },
          ].map(({ icon: Icon, title, desc, contact }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{desc}</p>
              <div className="text-xs font-mono text-primary">{contact}</div>
            </div>
          ))}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm font-medium text-foreground mb-1.5">Response times</div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>General inquiries</span><span className="text-foreground">1 business day</span></div>
              <div className="flex justify-between"><span>Enterprise sales</span><span className="text-foreground">Same day</span></div>
              <div className="flex justify-between"><span>Security disclosures</span><span className="text-foreground">4 hours</span></div>
              <div className="flex justify-between"><span>Billing support</span><span className="text-foreground">1 business day</span></div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STATUS PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function StatusPage({ navigate }: { navigate: (r: string) => void }) {
  const services = [
    { name: "API Gateway", status: "operational", latency: "42ms" },
    { name: "Agent Runtime", status: "operational", latency: "120ms" },
    { name: "Builder Service", status: "operational", latency: "88ms" },
    { name: "Validation Engine", status: "operational", latency: "55ms" },
    { name: "Billing Service", status: "operational", latency: "34ms" },
    { name: "Deployment Engine", status: "operational", latency: "71ms" },
    { name: "Storage", status: "operational", latency: "18ms" },
    { name: "Authentication", status: "operational", latency: "22ms" },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="System Status" title="All systems operational." sub="Real-time status for all VaanForge services. Last checked: just now." />
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-8">
        {/* Overall badge */}
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <div>
            <div className="text-sm font-semibold text-foreground">All Systems Operational</div>
            <div className="text-xs text-muted-foreground mt-0.5">No incidents in the last 7 days.</div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground font-mono">Updated Jun 30, 2025 16:12 IST</div>
        </div>

        {/* Service grid */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Services</div>
          </div>
          {services.map((s, i) => (
            <div key={s.name} className={`flex items-center justify-between px-5 py-3.5 ${i < services.length - 1 ? "border-b border-border" : ""}`}>
              <div className="text-sm text-foreground">{s.name}</div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground">{s.latency}</span>
                <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Operational
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Incident history */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Incident History</div>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Activity size={28} className="text-muted-foreground" />
            <div className="text-sm font-medium text-foreground">No incidents reported</div>
            <p className="text-xs text-muted-foreground max-w-xs">No public incidents are available. VaanForge maintains an uptime SLA for Professional+ plans.</p>
            <button onClick={() => navigate("sla")} className="text-xs text-primary hover:underline">View SLA â†’</button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DOCS PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DocsPage({ navigate }: { navigate: (r: string) => void }) {
  const categories = [
    { icon: Rocket, title: "Getting Started", desc: "Create your first project and run your first build in under 10 minutes.", count: 8 },
    { icon: GitMerge, title: "Builder Workflow", desc: "Understand the requirements â†’ blueprint â†’ build â†’ validation pipeline.", count: 12 },
    { icon: FileText, title: "Blueprint Approval", desc: "How to review, modify, and approve architecture blueprints.", count: 6 },
    { icon: Shield, title: "Build Validation", desc: "QA, security checks, and how to interpret validation reports.", count: 9 },
    { icon: Globe, title: "Deployment Readiness", desc: "Preparing and approving deployments with confidence.", count: 7 },
    { icon: CreditCard, title: "Billing & Credits", desc: "Plans, AI credit system, usage limits, and invoice management.", count: 5 },
    { icon: Lock, title: "Security", desc: "Authentication, RBAC, secret masking, and prompt injection defense.", count: 10 },
    { icon: BookOpen, title: "API Reference", desc: "Full REST API documentation with request/response examples.", count: 24 },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Documentation" title="Everything you need to build with VaanForge." />
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search documentationâ€¦" />
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">âŒ˜K</span>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(({ icon: Icon, title, desc, count }) => (
            <button key={title} className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Icon size={16} className="text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
              <div className="text-xs text-muted-foreground">{count} articles</div>
            </button>
          ))}
        </div>

        {/* Popular articles */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Popular Articles</div>
          <div className="space-y-1">
            {[
              "How to write effective software requirements",
              "Understanding blueprint review and approval",
              "Managing AI credits and plan limits",
              "Setting up deployment environments",
              "Interpreting security validation reports",
              "Exporting and downloading build outputs",
            ].map((article) => (
              <button key={article} className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted transition-colors text-left group">
                <span className="text-sm text-foreground">{article}</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELP PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function HelpPage({ navigate }: { navigate: (r: string) => void }) {
  const faqs = [
    { q: "How many projects can I have on the Free plan?", a: "The Free plan includes 1 project permanently. To create additional projects, upgrade to Creator (10 projects) or Professional (unlimited)." },
    { q: "What happens when I run out of AI credits?", a: "When credits are exhausted, agent operations are paused. You can upgrade your plan or wait for the monthly credit reset. No data is lost." },
    { q: "Can I export the code VaanForge generates?", a: "Yes. All build outputs are available as downloadable archives. You own your generated code fully." },
    { q: "How does blueprint approval work?", a: "After requirement analysis, the agent generates an architecture document. You must review and approve it before any code is written." },
    { q: "Is there a way to request changes to a blueprint?", a: "Yes â€” from the blueprint review screen you can annotate sections, ask the agent to revise specific modules, or reject and regenerate entirely." },
    { q: "What does 'validation failed' mean?", a: "The automated QA or security checks found issues that must be resolved before the build can be deployed. The report shows exactly which checks failed." },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Help Center" title="How can we help?" sub="Browse common questions or search for answers. You can also open a support ticket." />
      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Search help articlesâ€¦" />
        </div>

        {/* Category quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([["Billing", CreditCard], ["Projects", Cpu], ["Agent / Build", Cpu], ["Deployment", Rocket], ["Account", Users], ["API", BookOpen]] as [string, React.ElementType][]).map(([label, Icon]) => (
            <button key={label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground hover:border-primary/30 transition-colors">
              <Icon size={14} className="text-primary" />
              {label}
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Frequently Asked Questions</div>
          {faqs.map(({ q, a }) => (
            <details key={q} className="bg-card border border-border rounded-xl group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-medium text-foreground">
                {q}
                <ChevronRight size={14} className="text-muted-foreground group-open:rotate-90 transition-transform shrink-0 ml-3" />
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
            </details>
          ))}
        </div>

        {/* Still stuck */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <HelpCircle size={28} className="text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-semibold text-foreground mb-1">Still need help?</div>
          <p className="text-xs text-muted-foreground mb-4">Our team responds within 1 business day for all plans.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate("support")} className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">Open Support Ticket</button>
            <button onClick={() => navigate("contact")} className="text-xs px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted">Contact Us</button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SUPPORT PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SupportPage({ navigate }: { navigate: (r: string) => void }) {
  const [view, setView] = useState<"list" | "new">("list");
  const tickets = [
    { id: "SUP-1042", title: "Blueprint approval not responding", priority: "High", status: "open", owner: "VaanForge Support", updated: "2h ago" },
    { id: "SUP-1038", title: "AI credits deducted incorrectly", priority: "Medium", status: "resolved", owner: "Billing Team", updated: "1d ago" },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Support" title="Support tickets." sub="Create a ticket or check the status of an existing request." />
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div className="flex gap-3">
          <button onClick={() => setView("list")} className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${view === "list" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"}`}>My Tickets</button>
          <button onClick={() => setView("new")} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 ml-auto">
            <Plus size={14} /> New Ticket
          </button>
        </div>

        {view === "list" ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Title", "Priority", "Status", "Owner", "Updated"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{t.id}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === "High" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.owner}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="text-sm font-semibold text-foreground">Create New Ticket</div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Title</label>
              <input className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" placeholder="Describe the issue briefly" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none">
                  <option>Build</option><option>Billing</option><option>Agent</option><option>Account</option><option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <textarea rows={5} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors resize-none" placeholder="Provide as much detail as possible â€” build IDs, error messages, steps to reproduceâ€¦" />
            </div>
            <button className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">Submit Ticket</button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CHANGELOG PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function ChangelogPage({ navigate }: { navigate: (r: string) => void }) {
  const releases = [
    {
      version: "v1.3.0", date: "Jun 20, 2025",
      added: ["Blueprint diff view â€” compare revisions side by side", "Multi-model support â€” choose between available AI models per project", "Webhook triggers â€” fire builds from CI/CD pipelines via webhook"],
      changed: ["Requirement detection is now 40% faster with restructured prompt pipeline", "Sidebar chat history now groups by project context"],
      fixed: ["Authentication token refresh no longer causes session drops after 1 hour", "Blueprint approval button unresponsive on mobile Safari"],
      security: [],
    },
    {
      version: "v1.2.0", date: "May 15, 2025",
      added: ["Validation report export as PDF", "Per-module build status in the task graph view"],
      changed: ["Pricing page redesigned with clearer usage meters"],
      fixed: ["Build log timestamps now use user's local timezone", "Notification bell count resets correctly after reading"],
      security: ["Upgraded session token entropy from 128 to 256 bits"],
    },
    {
      version: "v1.1.0", date: "Apr 1, 2025",
      added: ["Output preview with syntax highlighting", "Deployment readiness check â€” pre-flight report before deploy"],
      changed: ["Agent follow-up questions now render inline instead of in a modal"],
      fixed: ["Storage usage meter was overcounting deleted files"],
      security: [],
    },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Changelog" title="What's new in VaanForge." sub="Release notes and updates, most recent first." />
      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-10">
        {releases.map((r) => (
          <div key={r.version} className="relative pl-6 border-l-2 border-border">
            <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-base font-bold text-foreground">{r.version}</span>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
            {r.added.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Added</div>
                <ul className="space-y-1">{r.added.map((i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary mt-1 shrink-0">+</span>{i}</li>)}</ul>
              </div>
            )}
            {r.changed.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-1.5">Changed</div>
                <ul className="space-y-1">{r.changed.map((i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-amber-500 mt-1 shrink-0">~</span>{i}</li>)}</ul>
              </div>
            )}
            {r.fixed.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1.5">Fixed</div>
                <ul className="space-y-1">{r.fixed.map((i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-blue-500 mt-1 shrink-0">âœ•</span>{i}</li>)}</ul>
              </div>
            )}
            {r.security.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-1.5">Security</div>
                <ul className="space-y-1">{r.security.map((i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-red-500 mt-1 shrink-0">ðŸ”’</span>{i}</li>)}</ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ROADMAP PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function RoadmapPage({ navigate }: { navigate: (r: string) => void }) {
  const columns = [
    { label: "Now", color: "text-primary border-primary/30 bg-primary/5", items: [
      { title: "Blueprint comparison", desc: "Side-by-side diff of blueprint revisions" },
      { title: "Multi-model selection", desc: "Choose AI model per project or per stage" },
      { title: "Webhook triggers", desc: "Trigger builds from external CI/CD" },
    ]},
    { label: "Next", color: "text-amber-500 border-amber-500/30 bg-amber-500/5", items: [
      { title: "GitHub integration", desc: "Push generated code directly to a repo" },
      { title: "Team workspaces", desc: "Shared workspaces with role-based access" },
      { title: "Custom validators", desc: "Define your own QA rules with YAML" },
    ]},
    { label: "Later", color: "text-blue-500 border-blue-500/30 bg-blue-500/5", items: [
      { title: "Mobile app", desc: "Review and approve builds from iOS / Android" },
      { title: "On-premise deployment", desc: "Self-hosted VaanForge for enterprise" },
      { title: "Plugin marketplace", desc: "Community-built agent extensions" },
    ]},
    { label: "Considering", color: "text-muted-foreground border-border bg-muted/30", items: [
      { title: "AI pair programming mode", desc: "Interactive co-build with the agent" },
      { title: "Video walkthrough export", desc: "Auto-generated project walkthroughs" },
      { title: "Figma-to-blueprint", desc: "Import Figma designs as UI requirements" },
    ]},
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Product Roadmap" title="Where VaanForge is headed." sub="A transparent view of what we're building now, next, and later. Priorities shift â€” this is our current direction." />
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(({ label, color, items }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${color.split(" ")[0]}`}>{label}</div>
              <div className="space-y-3">
                {items.map(({ title, desc }) => (
                  <div key={title} className="bg-card border border-border rounded-lg p-3">
                    <div className="text-xs font-semibold text-foreground">{title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-card border border-border rounded-xl p-5 text-center">
          <Star size={20} className="text-primary mx-auto mb-2" />
          <div className="text-sm font-semibold text-foreground mb-1">Have a feature request?</div>
          <p className="text-xs text-muted-foreground mb-3">We read every submission. Popular requests move up the roadmap.</p>
          <button onClick={() => navigate("contact")} className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">Submit Feedback</button>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRUST PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TrustPage({ navigate }: { navigate: (r: string) => void }) {
  const pillars = [
    { icon: Shield, title: "Security", desc: "JWT auth, RBAC, tenant isolation, secret masking, prompt injection defense, rate limiting, and webhook signature validation.", link: "security-page" },
    { icon: Lock, title: "Privacy", desc: "Workspace data is isolated per tenant. We do not train models on your project data. Data export and deletion on request.", link: "privacy" },
    { icon: CheckSquare, title: "Compliance Readiness", desc: "SOC 2 Type II in progress. GDPR-aligned data controls. Data processing agreements available for Enterprise plans.", link: "data-processing" },
    { icon: Activity, title: "Audit Logs", desc: "Every action is logged â€” who did what, when, and on which resource. Logs are immutable and exportable.", link: "legal" },
    { icon: Globe, title: "Data Controls", desc: "You own your generated code. VaanForge does not retain your outputs beyond your configured retention window.", link: "privacy" },
    { icon: Rocket, title: "Responsible AI", desc: "VaanForge runs all AI outputs through security and quality gates before showing them to users. We do not ship unvalidated code.", link: "security-page" },
  ];
  return (
    <PublicLayout navigate={navigate}>
      <PageHero tag="Trust Center" title="Built to be trusted by enterprises." sub="Security, privacy, and compliance â€” our commitments and controls." />
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map(({ icon: Icon, title, desc, link }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon size={16} className="text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground mb-2">{title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
              <button onClick={() => navigate(link)} className="text-xs text-primary hover:underline flex items-center gap-1">
                Learn more <ArrowRight size={10} />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-sm font-semibold text-foreground mb-2">Security disclosure</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">Found a vulnerability? We take security reports seriously and respond within 4 hours. Please do not disclose publicly before we have a chance to respond.</p>
          <a href="mailto:security@vaanforge.io" className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 inline-block">security@vaanforge.io</a>
        </div>
      </div>
    </PublicLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORT: PublicSite router
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AuthPage({ route, navigate }: { route: string; navigate: (r: string) => void }) {
  const config: Record<string, { title: string; copy: string; action: string; switchText: string; switchRoute: string }> = {
    login: { title: "Sign in to VaanForge", copy: "Continue to your AI software factory workspace.", action: "Sign in", switchText: "Create an account", switchRoute: "register" },
    register: { title: "Create your workspace", copy: "Start with one free project and upgrade when your team is ready.", action: "Create account", switchText: "Already have an account?", switchRoute: "login" },
    "forgot-password": { title: "Reset your password", copy: "Enter your work email and we will send a secure reset link.", action: "Send reset link", switchText: "Back to sign in", switchRoute: "login" },
    "verify-email": { title: "Verify your email", copy: "Check your inbox for a verification link before creating production projects.", action: "Resend verification", switchText: "Back to sign in", switchRoute: "login" },
  };
  const page = config[route] || config.login;
  return (
    <PublicLayout navigate={navigate}>
      <div className="min-h-[calc(100vh-56px)] px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock size={16} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{page.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{page.copy}</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Work email</span>
              <input type="email" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="you@company.com" />
            </label>
            {route !== "forgot-password" && route !== "verify-email" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
                <input type="password" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="••••••••" />
              </label>
            )}
            <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">{page.action}</button>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <button onClick={() => navigate(page.switchRoute)} className="hover:text-foreground">{page.switchText}</button>
            {route === "login" && <button onClick={() => navigate("forgot-password")} className="hover:text-foreground">Forgot password?</button>}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
export function PublicSite({ route, navigate }: PageProps) {
  if (["login", "register", "forgot-password", "verify-email"].includes(route)) return <AuthPage route={route} navigate={navigate} />;
  if (route === "about") return <AboutPage navigate={navigate} />;
  if (route === "contact") return <ContactPage navigate={navigate} />;
  if (route === "status") return <StatusPage navigate={navigate} />;
  if (route === "docs") return <DocsPage navigate={navigate} />;
  if (route === "help") return <HelpPage navigate={navigate} />;
  if (route === "support") return <SupportPage navigate={navigate} />;
  if (route === "changelog") return <ChangelogPage navigate={navigate} />;
  if (route === "roadmap") return <RoadmapPage navigate={navigate} />;
  if (route === "trust") return <TrustPage navigate={navigate} />;
  return null;
}


