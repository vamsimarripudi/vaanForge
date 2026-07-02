import React, { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { PageProps } from "./App";

// â”€â”€ Logo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Mark = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
    <path d="M5 5L16 26L27 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="26" r="2.5" fill="currentColor" />
    <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
    <circle cx="27" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
  </svg>
);

// â”€â”€ Legal nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LegalNav({ navigate }: { navigate: (r: string) => void }) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-40">
      <button onClick={() => navigate("workspace")} className="flex items-center gap-2 text-primary">
        <Mark size={16} />
        <span className="text-sm tracking-tight leading-none">
          <span className="font-semibold">Vaan</span>
          <span className="font-light opacity-70">Forge</span>
        </span>
      </button>
      <span className="text-muted-foreground text-sm hidden sm:block">/ Legal</span>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => navigate("workspace")} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 flex items-center gap-1">
          Open App <ArrowRight size={11} />
        </button>
      </div>
    </header>
  );
}

// â”€â”€ Legal layout with sticky TOC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LegalLayout({
  navigate, title, lastUpdated, sections, children,
}: {
  navigate: (r: string) => void;
  title: string;
  lastUpdated: string;
  sections: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LegalNav navigate={navigate} />
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-mono text-primary tracking-widest uppercase mb-2">Legal</div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">{title}</h1>
          <div className="text-xs text-muted-foreground">Last updated: {lastUpdated}</div>
        </div>

        <div className="flex gap-12">
          {/* TOC */}
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contents</div>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  className={`block text-xs py-1.5 px-2 rounded-lg transition-colors ${active === s.id ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 prose-sm max-w-none">
            {children}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            Questions about this document? <button onClick={() => navigate("contact")} className="text-primary hover:underline">Contact our legal team â†’</button>
          </div>
          <button onClick={() => navigate("legal")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">â† Back to Legal Hub</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Section component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEGAL HUB
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function LegalHubPage({ navigate }: { navigate: (r: string) => void }) {
  const docs = [
    { route: "terms", title: "Terms of Service", desc: "Acceptance of terms, account responsibilities, service availability, and limitations of liability.", updated: "Jun 1, 2025" },
    { route: "privacy", title: "Privacy Policy", desc: "What data we collect, how we use it, retention periods, and your rights.", updated: "Jun 1, 2025" },
    { route: "cookies", title: "Cookie Policy", desc: "Cookie categories, what we set, and how to manage your preferences.", updated: "Jun 1, 2025" },
    { route: "security-page", title: "Security Overview", desc: "Authentication, RBAC, tenant isolation, secret masking, and our vulnerability disclosure process.", updated: "Jun 1, 2025" },
    { route: "refund", title: "Refund Policy", desc: "Eligibility, failed payments, subscription cancellations, and processing timelines.", updated: "Jun 1, 2025" },
    { route: "acceptable-use", title: "Acceptable Use Policy", desc: "Allowed and prohibited uses, AI misuse prevention, and enforcement actions.", updated: "Jun 1, 2025" },
    { route: "data-processing", title: "Data Processing Agreement", desc: "Data roles, processing purposes, AI processing, retention, and security measures.", updated: "Jun 1, 2025" },
    { route: "subprocessors", title: "Subprocessors", desc: "List of third-party subprocessors, their purpose, region, and data categories.", updated: "Jun 1, 2025" },
    { route: "sla", title: "Service Level Agreement", desc: "Availability targets, support response times, incident severity, and maintenance windows.", updated: "Jun 1, 2025" },
    { route: "accessibility", title: "Accessibility Statement", desc: "Our commitment to accessibility, keyboard navigation, screen reader support, and known gaps.", updated: "Jun 1, 2025" },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LegalNav navigate={navigate} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="text-xs font-mono text-primary tracking-widest uppercase mb-2">Legal Hub</div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Legal Documents</h1>
          <p className="text-sm text-muted-foreground">All VaanForge legal, trust, and compliance documentation in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map(({ route, title, desc, updated }) => (
            <button
              key={route}
              onClick={() => navigate(route)}
              className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors mt-0.5 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
              <div className="text-xs text-muted-foreground mt-3">Updated {updated}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TERMS OF SERVICE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TermsPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "account", label: "Account Responsibilities" },
    { id: "billing", label: "Subscription & Billing" },
    { id: "ai-output", label: "AI-Generated Output" },
    { id: "content", label: "User Content" },
    { id: "prohibited", label: "Prohibited Use" },
    { id: "availability", label: "Service Availability" },
    { id: "termination", label: "Termination" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "changes", label: "Changes to Terms" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Terms of Service" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="acceptance" title="Acceptance of Terms">
        <p>By accessing or using VaanForge ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.</p>
        <p>If you do not agree to these terms, you may not use the Service.</p>
      </LSection>
      <LSection id="account" title="Account Responsibilities">
        <p>You are responsible for maintaining the security of your account credentials. VaanForge is not liable for any loss resulting from unauthorized use of your account.</p>
        <p>You must provide accurate information when creating your account and keep it up to date. Accounts created with false information may be terminated without notice.</p>
      </LSection>
      <LSection id="billing" title="Subscription & Billing">
        <p>Paid plans are billed in advance on a monthly or annual cycle. All fees are non-refundable except as described in the Refund Policy. Plan changes take effect at the start of the next billing cycle.</p>
        <p>Failure to pay may result in suspension of access. VaanForge reserves the right to change plan pricing with 30 days notice to subscribers.</p>
      </LSection>
      <LSection id="ai-output" title="AI-Generated Output Responsibility">
        <p>VaanForge generates code, architecture blueprints, and documentation using AI systems. While we apply validation checks, the Service does not guarantee that all output is complete, correct, or fit for production use.</p>
        <p>You are solely responsible for reviewing, testing, and validating all outputs before deploying them. VaanForge is not liable for losses arising from reliance on AI-generated content.</p>
      </LSection>
      <LSection id="content" title="User Content">
        <p>You retain ownership of all requirements, instructions, and project data you provide to VaanForge. By using the Service, you grant VaanForge a limited license to process your content for the purpose of delivering the Service.</p>
        <p>VaanForge does not use your project content to train AI models without explicit written consent.</p>
      </LSection>
      <LSection id="prohibited" title="Prohibited Use">
        <p>You may not use VaanForge to: build malware, attack other systems, generate CSAM, violate applicable laws, or circumvent access controls. See the Acceptable Use Policy for the full list of prohibited activities.</p>
      </LSection>
      <LSection id="availability" title="Service Availability">
        <p>VaanForge targets 99.5% monthly uptime for Professional and above plans. Scheduled maintenance is announced 48 hours in advance. See the SLA for definitions and credit entitlements.</p>
      </LSection>
      <LSection id="termination" title="Termination">
        <p>You may cancel your account at any time. VaanForge may terminate or suspend access for violations of these terms, with or without notice, depending on severity.</p>
        <p>Upon termination, you have 30 days to export your data. After that period, data may be permanently deleted.</p>
      </LSection>
      <LSection id="liability" title="Limitation of Liability">
        <p>To the maximum extent permitted by law, VaanForge is not liable for indirect, incidental, special, or consequential damages. Our total liability for any claim arising from use of the Service is limited to fees paid in the 3 months preceding the claim.</p>
      </LSection>
      <LSection id="changes" title="Changes to Terms">
        <p>We may update these terms from time to time. Material changes will be communicated by email and in-app notification at least 14 days before taking effect. Continued use after changes constitutes acceptance.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRIVACY POLICY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function PrivacyPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "collected", label: "Data Collected" },
    { id: "usage", label: "How Data is Used" },
    { id: "workspace", label: "Workspace & Project Data" },
    { id: "ai", label: "AI Processing" },
    { id: "billing", label: "Billing Data" },
    { id: "cookies", label: "Cookies" },
    { id: "retention", label: "Data Retention" },
    { id: "rights", label: "Your Rights" },
    { id: "security", label: "Security Controls" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Privacy Policy" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="collected" title="Data We Collect">
        <p>We collect: account registration data (name, email, company), project content you submit (requirements, prompts, instructions), usage data (feature usage, session duration), billing data (via our payment processor), and technical data (IP address, browser type, error logs).</p>
      </LSection>
      <LSection id="usage" title="How We Use Data">
        <p>Your data is used to: provide and improve the Service, process payments, communicate service updates and security alerts, and respond to support requests. We do not sell your personal data to third parties.</p>
      </LSection>
      <LSection id="workspace" title="Workspace & Project Data">
        <p>All workspace data is logically isolated per tenant. Project data â€” requirements, blueprints, build outputs â€” is stored encrypted at rest and in transit. Access is restricted to your account and workspace members you authorize.</p>
      </LSection>
      <LSection id="ai" title="AI Processing">
        <p>Your prompts and project content are sent to AI model providers for processing as part of the build pipeline. We do not use your project content to fine-tune models without explicit written consent. See our Subprocessors list for the AI providers we use.</p>
      </LSection>
      <LSection id="billing" title="Billing Data">
        <p>Payment processing is handled by a PCI-DSS compliant third-party processor. VaanForge does not store full card numbers. We retain billing records (amount, date, plan) for 7 years for legal compliance.</p>
      </LSection>
      <LSection id="cookies" title="Cookies">
        <p>We use essential cookies for authentication and session management. Analytics and preference cookies are optional. See our Cookie Policy for full details and preference controls.</p>
      </LSection>
      <LSection id="retention" title="Data Retention">
        <p>Active account data is retained while your account exists. Deleted projects are purged within 30 days. Account data is deleted within 60 days of account closure. Billing records are retained for 7 years.</p>
      </LSection>
      <LSection id="rights" title="Your Rights">
        <p>You have the right to: access your data, correct inaccuracies, request deletion, export your data, restrict processing, and object to processing for marketing. Submit requests to privacy@vaanforge.io. We respond within 30 days.</p>
      </LSection>
      <LSection id="security" title="Security Controls">
        <p>We use TLS 1.3 for data in transit, AES-256 for data at rest, role-based access controls, and regular third-party security audits. See the Security Overview for full technical details.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COOKIES PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function CookiesPage({ navigate }: { navigate: (r: string) => void }) {
  const [analytics, setAnalytics] = useState(false);
  const [improvement, setImprovement] = useState(false);
  const [saved, setSaved] = useState(false);

  const sections = [
    { id: "essential", label: "Essential Cookies" },
    { id: "analytics", label: "Analytics Cookies" },
    { id: "improvement", label: "Product Improvement" },
    { id: "preferences", label: "Manage Preferences" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Cookie Policy" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="essential" title="Essential Cookies">
        <p>These cookies are required for VaanForge to function. They cannot be disabled. They include session tokens, CSRF protection cookies, and load balancer affinity cookies. No personal data is shared with third parties via these cookies.</p>
        <div className="mt-3 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-foreground">Essential</div>
              <div className="text-xs text-muted-foreground">Always active</div>
            </div>
            <div className="text-xs text-primary font-medium">Required</div>
          </div>
        </div>
      </LSection>
      <LSection id="analytics" title="Analytics Cookies">
        <p>Analytics cookies help us understand how users interact with VaanForge â€” which features are used, where users encounter problems, and how to improve navigation. We use first-party analytics only; no data is shared with advertising networks.</p>
        <div className="mt-3 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-foreground">Analytics</div>
              <div className="text-xs text-muted-foreground">Usage patterns, feature engagement</div>
            </div>
            <button onClick={() => setAnalytics(!analytics)} className={`w-10 h-5 rounded-full transition-colors relative ${analytics ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${analytics ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </LSection>
      <LSection id="improvement" title="Product Improvement Cookies">
        <p>These cookies enable features like session replay and error tracking to help us identify and fix bugs. Session replays are anonymized â€” no personal data, passwords, or payment information is recorded.</p>
        <div className="mt-3 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-foreground">Product Improvement</div>
              <div className="text-xs text-muted-foreground">Error tracking, anonymized session data</div>
            </div>
            <button onClick={() => setImprovement(!improvement)} className={`w-10 h-5 rounded-full transition-colors relative ${improvement ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${improvement ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </LSection>
      <LSection id="preferences" title="Manage Preferences">
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            {saved ? "Saved âœ“" : "Save Preferences"}
          </button>
          <button
            onClick={() => { setAnalytics(false); setImprovement(false); }}
            className="text-xs px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </button>
        </div>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SECURITY PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SecurityPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "auth", label: "Authentication" },
    { id: "rbac", label: "Role-Based Access" },
    { id: "isolation", label: "Tenant Isolation" },
    { id: "secrets", label: "Secret Masking" },
    { id: "prompt", label: "Prompt Injection Defense" },
    { id: "rate", label: "Rate Limiting" },
    { id: "audit", label: "Audit Logs" },
    { id: "deploy", label: "Deployment Safety" },
    { id: "disclosure", label: "Vulnerability Disclosure" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Security Overview" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="auth" title="Authentication">
        <p>VaanForge uses JWT-based authentication with short-lived access tokens (15 minutes) and long-lived refresh tokens stored in secure, HttpOnly cookies. All tokens are signed with RS256. Sessions expire after 7 days of inactivity.</p>
        <p>Multi-factor authentication (TOTP) is available and strongly recommended for all users.</p>
      </LSection>
      <LSection id="rbac" title="Role-Based Access Control">
        <p>Access to workspace resources is governed by RBAC. Roles include Owner, Admin, Builder, and Viewer. Permissions are enforced server-side on every API request. Team members can be assigned roles per workspace, not globally.</p>
      </LSection>
      <LSection id="isolation" title="Tenant Isolation">
        <p>Every VaanForge workspace is fully isolated at the data layer. Queries are always scoped to a tenant identifier. Row-level security is enforced in the database layer. Cross-tenant data access is architecturally impossible.</p>
      </LSection>
      <LSection id="secrets" title="Secret Masking">
        <p>VaanForge scans all build outputs, logs, and agent responses for secrets before displaying them to users. Patterns including API keys, tokens, passwords, and connection strings are masked with asterisks.</p>
      </LSection>
      <LSection id="prompt" title="Prompt Injection Defense">
        <p>All user inputs to the agent are sanitized to detect prompt injection attempts. Inputs containing instruction override patterns are flagged and blocked before reaching the AI model. Each build pipeline stage re-validates inputs independently.</p>
      </LSection>
      <LSection id="rate" title="Rate Limiting">
        <p>All API endpoints enforce rate limits per user and per IP. Agent invocations are additionally limited by plan-level AI credit quotas. Exceeded limits return 429 responses with Retry-After headers.</p>
      </LSection>
      <LSection id="audit" title="Audit Logs">
        <p>Every resource action (create, read, update, delete, approve, deploy) is written to an immutable audit log. Logs include the actor identity, timestamp, IP address, and action details. Logs are available for export and retained for 1 year by default (configurable on Enterprise).</p>
      </LSection>
      <LSection id="deploy" title="Deployment Safety">
        <p>VaanForge runs a pre-deployment checklist before any deployment is authorized. Checks include: secret scanning, dependency vulnerability scan, QA result review, and explicit human approval. Deployments blocked by any check cannot be overridden without an admin escalation.</p>
      </LSection>
      <LSection id="disclosure" title="Vulnerability Disclosure">
        <p>We welcome responsible disclosure of security vulnerabilities. Report to security@vaanforge.io with full reproduction steps. We acknowledge reports within 4 hours and aim to patch critical issues within 72 hours. We do not pursue legal action against good-faith researchers.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REFUND POLICY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function RefundPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "eligibility", label: "Eligibility" },
    { id: "failed", label: "Failed Payments" },
    { id: "credits", label: "Credit Refunds" },
    { id: "cancellation", label: "Cancellation" },
    { id: "enterprise", label: "Enterprise Contracts" },
    { id: "timeline", label: "Processing Timeline" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Refund Policy" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="eligibility" title="Eligibility">
        <p>Subscription fees are generally non-refundable. Exceptions apply when VaanForge experiences a service outage that breaches our SLA commitments, or when a billing error results in overcharging.</p>
        <p>Refund requests must be submitted within 14 days of the charge. Requests outside this window are evaluated case-by-case.</p>
      </LSection>
      <LSection id="failed" title="Failed Payments">
        <p>If a payment fails, VaanForge will retry 3 times over 7 days before suspending the account. Suspended accounts retain data for 30 days. Updating payment details and paying the outstanding amount restores full access immediately.</p>
      </LSection>
      <LSection id="credits" title="AI Credit Refunds">
        <p>AI credits consumed during successful build operations are not refunded. Credits consumed due to verified Service errors (e.g., agent crashes caused by VaanForge infrastructure failures) are credited back to your account.</p>
      </LSection>
      <LSection id="cancellation" title="Subscription Cancellations">
        <p>You may cancel at any time. Cancellation takes effect at the end of the current billing period. Access continues until then. No partial-month refunds are issued.</p>
        <p>Annual plan subscribers who cancel within 14 days of the renewal charge may request a pro-rated refund for unused months, minus any consumed AI credits beyond the Free plan allowance.</p>
      </LSection>
      <LSection id="enterprise" title="Enterprise Contracts">
        <p>Enterprise agreements are governed by the individual contract terms negotiated at signing. Enterprise refunds and credit adjustments are handled through the account CSM.</p>
      </LSection>
      <LSection id="timeline" title="Processing Timeline">
        <p>Approved refunds are processed within 5â€“10 business days and returned to the original payment method. Bank processing time may add an additional 2â€“5 days depending on your financial institution.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACCEPTABLE USE POLICY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AcceptableUsePage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "allowed", label: "Allowed Use" },
    { id: "prohibited", label: "Prohibited Use" },
    { id: "abuse", label: "Abuse Prevention" },
    { id: "ai-misuse", label: "AI Misuse" },
    { id: "security", label: "Security Testing Rules" },
    { id: "enforcement", label: "Enforcement" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Acceptable Use Policy" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="allowed" title="Allowed Use">
        <p>VaanForge may be used to: build legitimate software products and services, prototype and test software ideas, generate documentation and APIs for lawful applications, and automate software development workflows within your organization.</p>
      </LSection>
      <LSection id="prohibited" title="Prohibited Use">
        <p>You may not use VaanForge to: build malware, ransomware, spyware, or tools designed to cause harm; attack, scrape, or disrupt other systems; generate content that is illegal in your jurisdiction; violate the intellectual property rights of others; or evade security controls.</p>
      </LSection>
      <LSection id="abuse" title="Abuse Prevention">
        <p>VaanForge monitors usage patterns for abuse signals including unusual build volumes, repeated policy violations, and attempts to extract model weights or bypass safety filters. Accounts flagged for abuse may be suspended pending investigation.</p>
      </LSection>
      <LSection id="ai-misuse" title="AI Misuse">
        <p>You may not use the VaanForge agent to generate content designed to deceive, defraud, or manipulate others. You may not attempt to extract training data or system prompts from the agent, or use it to generate content that violates the terms of the underlying AI model providers.</p>
      </LSection>
      <LSection id="security" title="Security Testing Rules">
        <p>You may use VaanForge to build security testing tools for systems you own or have explicit written authorization to test. You may not use it to build tools designed for unauthorized penetration testing, vulnerability scanning of third-party systems, or offensive exploitation.</p>
      </LSection>
      <LSection id="enforcement" title="Enforcement">
        <p>Violations of this policy may result in: a warning, temporary suspension, permanent termination, or referral to law enforcement depending on severity. We may remove content or disable builds that violate this policy without prior notice.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DATA PROCESSING AGREEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DataProcessingPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "roles", label: "Data Roles" },
    { id: "purposes", label: "Processing Purposes" },
    { id: "ai", label: "AI Processing" },
    { id: "retention", label: "Retention" },
    { id: "export", label: "Export & Deletion" },
    { id: "security", label: "Security Measures" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Data Processing Agreement" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="roles" title="Data Roles">
        <p>VaanForge acts as a Data Processor when processing data on behalf of customers who are Data Controllers. For data collected about users directly (account data, usage analytics), VaanForge acts as a Data Controller.</p>
      </LSection>
      <LSection id="purposes" title="Processing Purposes">
        <p>Customer data is processed only for the following purposes: delivering the VaanForge service, billing and account management, security monitoring and abuse prevention, and legal compliance obligations.</p>
      </LSection>
      <LSection id="ai" title="AI Processing">
        <p>Project data submitted by users may be transmitted to third-party AI model providers for inference. This processing is transient â€” providers are contractually prohibited from retaining your data for training. See Subprocessors for the current list of AI providers.</p>
      </LSection>
      <LSection id="retention" title="Retention Periods">
        <div className="space-y-1.5">
          {[
            ["Account data", "Duration of account + 60 days"],
            ["Project data", "Duration of project + 30 days after deletion"],
            ["Billing records", "7 years (legal requirement)"],
            ["Audit logs", "1 year (configurable on Enterprise)"],
            ["AI inference data", "Not retained beyond request lifetime"],
          ].map(([type, period]) => (
            <div key={type as string} className="flex justify-between py-1.5 border-b border-border last:border-0 text-xs">
              <span className="text-foreground">{type}</span>
              <span className="text-muted-foreground">{period}</span>
            </div>
          ))}
        </div>
      </LSection>
      <LSection id="export" title="Data Export & Deletion">
        <p>You can export all project data, builds, and outputs from the workspace settings at any time. Account deletion requests are processed within 30 days. After deletion, data is purged from all systems within 90 days.</p>
      </LSection>
      <LSection id="security" title="Security Measures">
        <p>Technical measures include: TLS 1.3 in transit, AES-256 at rest, regular penetration testing, SOC 2 Type II audit (in progress), and background-checked access for employees handling customer data.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SUBPROCESSORS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SubprocessorsPage({ navigate }: { navigate: (r: string) => void }) {
  const subs = [
    { name: "Cloud Infrastructure Provider", purpose: "Compute, storage, networking", region: "India, Singapore", category: "All data", status: "Active" },
    { name: "AI Model Provider (Primary)", purpose: "Code generation, requirement analysis", region: "US", category: "Project prompts", status: "Active" },
    { name: "Payment Processor", purpose: "Subscription billing, invoicing", region: "Global", category: "Billing data only", status: "Active" },
    { name: "Email Delivery Service", purpose: "Transactional email (alerts, invoices)", region: "US", category: "Email, name", status: "Active" },
    { name: "Error Monitoring Service", purpose: "Crash reporting, error tracking", region: "US", category: "Anonymized error data", status: "Active" },
    { name: "Log Management Service", purpose: "Application and audit log storage", region: "India", category: "Usage logs", status: "Active" },
  ];
  const sections = [
    { id: "list", label: "Subprocessor List" },
    { id: "changes", label: "Change Notification" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Subprocessors" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="list" title="Current Subprocessors">
        <p>The following third parties process data on behalf of VaanForge as part of delivering the service.</p>
        <div className="mt-4 bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Subprocessor", "Purpose", "Region", "Data Category", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                  <td className="px-4 py-3"><span className="text-primary">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LSection>
      <LSection id="changes" title="Change Notification">
        <p>VaanForge will notify customers of material changes to the subprocessor list (additions or replacements) via email at least 14 days before the change takes effect. Customers on Enterprise plans may object to specific subprocessor additions.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SLA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SLAPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "uptime", label: "Availability Targets" },
    { id: "support", label: "Support Response Times" },
    { id: "severity", label: "Incident Severity" },
    { id: "maintenance", label: "Maintenance Windows" },
    { id: "exclusions", label: "Exclusions" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Service Level Agreement" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="uptime" title="Availability Targets">
        <div className="space-y-1.5">
          {[
            ["Free", "No SLA guarantee"],
            ["Creator", "99% monthly uptime"],
            ["Professional", "99.5% monthly uptime"],
            ["Studio", "99.5% monthly uptime"],
            ["Business", "99.9% monthly uptime"],
            ["Enterprise", "Custom (up to 99.95%)"],
          ].map(([plan, target]) => (
            <div key={plan as string} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
              <span className="text-foreground font-medium">{plan}</span>
              <span className="text-muted-foreground">{target}</span>
            </div>
          ))}
        </div>
        <p className="mt-3">Uptime is measured monthly, excluding scheduled maintenance. Downtime credits are applied as account credits in the following billing cycle. See your plan details for credit calculation methodology.</p>
      </LSection>
      <LSection id="support" title="Support Response Times">
        <div className="space-y-1.5">
          {[
            ["Critical (P0)", "All paid plans", "1 hour"],
            ["High (P1)", "Professional+", "4 hours"],
            ["Medium (P2)", "Professional+", "1 business day"],
            ["Low (P3)", "All plans", "2 business days"],
          ].map(([severity, plan, time]) => (
            <div key={severity as string} className="flex justify-between py-2 border-b border-border last:border-0 text-xs">
              <span className="text-foreground font-medium">{severity}</span>
              <span className="text-muted-foreground">{plan}</span>
              <span className="text-foreground">{time}</span>
            </div>
          ))}
        </div>
      </LSection>
      <LSection id="severity" title="Incident Severity Definitions">
        <p><strong className="text-foreground">P0 â€“ Critical:</strong> Complete service outage or data loss affecting all users.</p>
        <p><strong className="text-foreground">P1 â€“ High:</strong> Major feature unavailable or degraded for a significant portion of users.</p>
        <p><strong className="text-foreground">P2 â€“ Medium:</strong> Non-critical feature degraded. Workaround available.</p>
        <p><strong className="text-foreground">P3 â€“ Low:</strong> Minor issue with minimal impact. No workaround required.</p>
      </LSection>
      <LSection id="maintenance" title="Maintenance Windows">
        <p>Scheduled maintenance is announced 48 hours in advance via in-app notification and email. Standard maintenance windows are Sundays 02:00â€“05:00 IST. Emergency patches may be applied outside this window with as much notice as practicable.</p>
      </LSection>
      <LSection id="exclusions" title="Exclusions">
        <p>Downtime caused by the following is excluded from SLA calculations: force majeure, customer-caused incidents, third-party network issues outside our control, scheduled maintenance, and Free plan usage.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACCESSIBILITY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AccessibilityPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "commitment", label: "Commitment" },
    { id: "keyboard", label: "Keyboard Navigation" },
    { id: "screen-reader", label: "Screen Reader Support" },
    { id: "contrast", label: "Color Contrast" },
    { id: "motion", label: "Reduced Motion" },
    { id: "gaps", label: "Known Gaps" },
    { id: "feedback", label: "Feedback" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Accessibility Statement" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="commitment" title="Our Accessibility Commitment">
        <p>VaanForge is committed to making the product usable by everyone, including people who rely on assistive technologies. We target WCAG 2.1 AA compliance across the product and public pages.</p>
        <p>Accessibility is treated as a feature, not a retrofit. New interface components are designed with keyboard navigation, ARIA roles, and sufficient contrast from the start.</p>
      </LSection>
      <LSection id="keyboard" title="Keyboard Navigation">
        <p>All interactive elements in VaanForge are reachable and operable via keyboard. Tab order follows logical reading order. Focus indicators are visible and meet 3:1 contrast ratio. Modal dialogs trap focus and return it to the trigger element on close.</p>
        <p>Custom components (sidebar toggle, theme selector, approval buttons) include keyboard-specific interaction patterns with visible focus states.</p>
      </LSection>
      <LSection id="screen-reader" title="Screen Reader Support">
        <p>VaanForge is tested with VoiceOver (macOS/iOS) and NVDA (Windows). All icon-only buttons have aria-label attributes. Dynamic content changes use aria-live regions to announce updates to screen reader users.</p>
        <p>Data tables use proper thead/tbody structure with scope attributes. Status badges use both color and text labels.</p>
      </LSection>
      <LSection id="contrast" title="Color Contrast">
        <p>Body text meets WCAG AA (4.5:1 minimum). Large text (18px+ or 14px+ bold) meets 3:1 minimum. Interactive elements use both color and shape/text to communicate state â€” we do not rely on color alone.</p>
        <p>The dark theme and light theme have both been tested independently for contrast compliance.</p>
      </LSection>
      <LSection id="motion" title="Reduced Motion">
        <p>VaanForge respects the prefers-reduced-motion media query. When reduced motion is enabled, animations are replaced with instant transitions or simplified alternatives. The skeleton shimmer, sidebar toggle, and modal animations all have reduced-motion variants.</p>
      </LSection>
      <LSection id="gaps" title="Known Gaps">
        <p>We are aware of the following accessibility gaps and are actively working to address them:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Agent chat streaming output does not yet announce updates via aria-live on all browsers</li>
          <li>Some complex data tables in the validation report view lack full mobile screen reader support</li>
          <li>Drag-and-drop reordering in the task graph view is not yet keyboard accessible</li>
        </ul>
      </LSection>
      <LSection id="feedback" title="Accessibility Feedback">
        <p>If you encounter an accessibility barrier, please contact us at accessibility@vaanforge.io. We prioritize accessibility bugs and aim to resolve reported issues within 5 business days.</p>
      </LSection>
    </LegalLayout>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORT: LegalSite router
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function PlanLimitsPage({ navigate }: { navigate: (r: string) => void }) {
  const sections = [
    { id: "source", label: "Source of Truth" },
    { id: "limits", label: "Plan Limits" },
    { id: "enforcement", label: "Enforcement" },
    { id: "exceeded", label: "Limit Exceeded" },
  ];
  return (
    <LegalLayout navigate={navigate} title="Plan Limits Policy" lastUpdated="June 1, 2025" sections={sections}>
      <LSection id="source" title="Source of Truth">
        <p>VaanForge plan limits are enforced server-side. The frontend may display limits and upgrade paths, but it is never the source of truth for entitlements, pricing, credits, storage, deployments, templates, users, API access, or marketplace access.</p>
      </LSection>
      <LSection id="limits" title="Approved Limits">
        <p>Free includes 1 active project, 1 workspace, 1 user, 500 AI credits per month, 1 GB storage, 5 deployments per month, and 5 basic templates. Creator, Professional, Studio, Business, and Enterprise tiers increase those limits according to the approved billing plan configuration.</p>
      </LSection>
      <LSection id="enforcement" title="Server-Side Enforcement">
        <p>Before protected actions run, VaanForge checks project count, AI credits, storage, deployment count, users, templates, marketplace access, private plugins, API access, white-label access, and advanced analytics entitlements.</p>
      </LSection>
      <LSection id="exceeded" title="When a Limit is Exceeded">
        <p>The action is blocked safely, the current plan and required plan are shown, an upgrade path is provided, and a usage event is logged. VaanForge does not silently fail or create fake success states.</p>
      </LSection>
    </LegalLayout>
  );
}
export function LegalSite({ route, navigate }: PageProps) {
  if (route === "legal") return <LegalHubPage navigate={navigate} />;
  if (route === "terms") return <TermsPage navigate={navigate} />;
  if (route === "privacy") return <PrivacyPage navigate={navigate} />;
  if (route === "cookies") return <CookiesPage navigate={navigate} />;
  if (route === "security-page") return <SecurityPage navigate={navigate} />;
  if (route === "refund") return <RefundPage navigate={navigate} />;
  if (route === "acceptable-use") return <AcceptableUsePage navigate={navigate} />;
  if (route === "data-processing") return <DataProcessingPage navigate={navigate} />;
  if (route === "subprocessors") return <SubprocessorsPage navigate={navigate} />;
  if (route === "sla") return <SLAPage navigate={navigate} />;
  if (route === "accessibility") return <AccessibilityPage navigate={navigate} />;
  if (route === "plan-limits") return <PlanLimitsPage navigate={navigate} />;
  return null;
}

