import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Ban, CheckCircle2, CloudOff, CreditCard, FileQuestion, Loader2, Server, ShieldAlert, Wrench } from "lucide-react";
import type { PageProps } from "./App";
import { apiClient } from "../services/apiClient";

export type DomainGuard =
  | "public"
  | "authenticated"
  | "workspace_member"
  | "billing_required"
  | "developer_access"
  | "admin_access"
  | "super_admin_access"
  | "support_access"
  | "internal_service";

export type DomainStateKind =
  | "loading"
  | "empty"
  | "error"
  | "permission-denied"
  | "plan-limit"
  | "not-found"
  | "maintenance"
  | "offline"
  | "session-expired";

export type ShellKind =
  | "public"
  | "product"
  | "account"
  | "commercial"
  | "support"
  | "developer"
  | "admin"
  | "content"
  | "asset";

export type DomainMetadata = {
  productTitle: string;
  pageTitle: string;
  description: string;
  canonicalUrl: string;
  robots: "index,follow" | "noindex,nofollow";
  openGraph?: {
    title: string;
    description: string;
    url: string;
  };
};

export type ShellDefinition = {
  key: string;
  host: string;
  label: string;
  kind: ShellKind;
  guard: DomainGuard;
  defaultRoute: string;
  description: string;
  navigation: Array<{ label: string; route: string; guard?: DomainGuard }>;
  metadata: DomainMetadata;
  state: DomainStateKind;
};

export type ViewerSession = {
  authenticated: boolean;
  roles: string[];
  workspaceMember: boolean;
  developer: boolean;
  billingActive: boolean;
  support: boolean;
  planLimited: boolean;
  expired: boolean;
};

export type GuardResult =
  | { allowed: true }
  | { allowed: false; state: DomainStateKind; redirectUrl?: string; reason: string; requiredPlan?: string };

const rootDomain = envValue("VITE_VAANFORGE_ROOT_DOMAIN", "vaanforge.com");

export const DOMAIN_URLS = {
  root: urlFromEnv("VITE_VAANFORGE_PUBLIC_URL", rootDomain),
  www: urlFromEnv("VITE_VAANFORGE_WWW_URL", `www.${rootDomain}`),
  app: urlFromEnv("VITE_VAANFORGE_APP_URL", `app.${rootDomain}`),
  auth: urlFromEnv("VITE_VAANFORGE_AUTH_URL", `auth.${rootDomain}`),
  profile: urlFromEnv("VITE_VAANFORGE_PROFILE_URL", `profile.${rootDomain}`),
  settings: urlFromEnv("VITE_VAANFORGE_SETTINGS_URL", `settings.${rootDomain}`),
  plans: urlFromEnv("VITE_VAANFORGE_PLANS_URL", `plans.${rootDomain}`),
  support: urlFromEnv("VITE_VAANFORGE_SUPPORT_URL", `support.${rootDomain}`),
  admin: urlFromEnv("VITE_VAANFORGE_ADMIN_URL", `admin.${rootDomain}`),
  docs: urlFromEnv("VITE_VAANFORGE_DOCS_URL", `docs.${rootDomain}`),
  status: urlFromEnv("VITE_VAANFORGE_STATUS_URL", `status.${rootDomain}`),
  developers: urlFromEnv("VITE_VAANFORGE_DEVELOPERS_URL", `developers.${rootDomain}`),
  marketplace: urlFromEnv("VITE_VAANFORGE_MARKETPLACE_URL", `marketplace.${rootDomain}`),
  api: urlFromEnv("VITE_VAANFORGE_API_URL", `api.${rootDomain}`),
  assets: urlFromEnv("VITE_VAANFORGE_ASSETS_URL", `assets.${rootDomain}`),
  cdn: urlFromEnv("VITE_VAANFORGE_CDN_URL", `cdn.${rootDomain}`),
  uploads: urlFromEnv("VITE_VAANFORGE_UPLOADS_URL", `uploads.${rootDomain}`),
  files: urlFromEnv("VITE_VAANFORGE_FILES_URL", `files.${rootDomain}`),
  webhooks: urlFromEnv("VITE_VAANFORGE_WEBHOOKS_URL", `webhooks.${rootDomain}`),
  events: urlFromEnv("VITE_VAANFORGE_EVENTS_URL", `events.${rootDomain}`),
  billing: urlFromEnv("VITE_VAANFORGE_BILLING_URL", `billing.${rootDomain}`),
  checkout: urlFromEnv("VITE_VAANFORGE_CHECKOUT_URL", `checkout.${rootDomain}`),
  console: urlFromEnv("VITE_VAANFORGE_CONSOLE_URL", `console.${rootDomain}`),
  factory: urlFromEnv("VITE_VAANFORGE_FACTORY_URL", `factory.${rootDomain}`),
  agents: urlFromEnv("VITE_VAANFORGE_AGENTS_URL", `agents.${rootDomain}`),
  deploy: urlFromEnv("VITE_VAANFORGE_DEPLOY_URL", `deploy.${rootDomain}`),
  releases: urlFromEnv("VITE_VAANFORGE_RELEASES_URL", `releases.${rootDomain}`),
  legal: urlFromEnv("VITE_VAANFORGE_LEGAL_URL", `legal.${rootDomain}`),
  feedback: urlFromEnv("VITE_VAANFORGE_FEEDBACK_URL", `feedback.${rootDomain}`),
  learn: urlFromEnv("VITE_VAANFORGE_LEARN_URL", `learn.${rootDomain}`),
  blog: urlFromEnv("VITE_VAANFORGE_BLOG_URL", `blog.${rootDomain}`),
  partners: urlFromEnv("VITE_VAANFORGE_PARTNERS_URL", `partners.${rootDomain}`),
  enterprise: urlFromEnv("VITE_VAANFORGE_ENTERPRISE_URL", `enterprise.${rootDomain}`)
} as const;

export const SHELL_DEFINITIONS: ShellDefinition[] = [
  shell("root", "Public", "public", "public", "workspace", "Primary VaanForge entry shell.", ["Product:workspace", "Pricing:pricing", "Docs:docs", "Support:support"], "index,follow"),
  shell("www", "Public", "public", "public", "workspace", "Canonical public alias.", ["Product:workspace", "Pricing:pricing", "Docs:docs"], "index,follow"),
  shell("app", "Workspace", "product", "authenticated", "workspace", "Project, factory, agent, deployment, and support workspace.", ["Projects:projects", "Factory:factory", "Agents:project-agents", "Deployments:deployments", "Docs:docs", "Support:support", "Settings:settings"], "noindex,nofollow"),
  shell("factory", "Factory", "product", "workspace_member", "factory", "Autonomous software factory execution shell.", ["Projects:projects", "Intake:project-intake", "Blueprint:project-blueprint", "Tasks:project-tasks", "QA:project-qa", "Release:project-release"], "noindex,nofollow"),
  shell("agents", "Agents", "product", "workspace_member", "project-agents", "Agent runs, approvals, logs, and handoffs.", ["Runs:admin-agents", "Tasks:project-tasks", "Logs:builds", "Security:project-security"], "noindex,nofollow"),
  shell("auth", "Auth", "account", "public", "login", "Authentication and account verification shell.", ["Login:login", "Register:register", "Reset:forgot-password", "Verify:verify-email"], "noindex,nofollow"),
  shell("profile", "Profile", "account", "authenticated", "profile", "Personal account, sessions, usage, API keys, notifications, and activity.", ["Overview:profile", "Personal Info:profile", "Security:admin-security", "Sessions:profile", "Usage:billing-usage", "Plan:pricing", "API Keys:developer-api-keys", "Notifications:settings", "Activity:admin-audit"], "noindex,nofollow"),
  shell("settings", "Settings", "account", "workspace_member", "settings", "Workspace and account configuration shell.", ["Account:profile", "Workspace:settings", "Team:settings", "Billing:billing", "Usage:billing-usage", "API Keys:developer-api-keys", "AI Preferences:settings", "Notifications:settings", "Security:admin-security", "Data & Privacy:privacy", "Integrations:developer-apps", "Developer:developers", "Support:support"], "noindex,nofollow"),
  shell("plans", "Plans", "commercial", "public", "pricing", "Pricing, comparison, checkout, billing help, and terms.", ["Pricing:pricing", "Compare:pricing", "Checkout:billing-checkout", "Billing Help:support", "Terms:terms"], "index,follow"),
  shell("billing", "Billing", "commercial", "billing_required", "billing", "Subscription, invoices, usage, and credit wallet.", ["Dashboard:billing", "Subscription:billing-subscription", "Invoices:billing-invoices", "Usage:billing-usage", "Credits:billing-credits", "Plans:pricing"], "noindex,nofollow"),
  shell("checkout", "Checkout", "commercial", "billing_required", "billing-checkout", "Secure checkout and payment result handoff.", ["Checkout:billing-checkout", "Payment Status:billing-result", "Plans:pricing", "Support:support"], "noindex,nofollow"),
  shell("support", "Support", "support", "support_access", "support", "Support tickets, knowledge base, announcements, status, and contact.", ["Dashboard:support", "My Tickets:support", "Create Ticket:support", "Knowledge Base:help", "Announcements:changelog", "System Status:status", "Contact Support:contact"], "noindex,nofollow"),
  shell("feedback", "Feedback", "support", "authenticated", "support", "Feedback and product request capture.", ["Submit Feedback:support", "Requests:roadmap", "Support:support"], "noindex,nofollow"),
  shell("status", "Status", "support", "public", "status", "Public system status and incident communication.", ["Overview:status", "Incidents:status", "Subscribe:support"], "index,follow"),
  shell("developers", "Developers", "developer", "developer_access", "developers", "Developer portal, apps, API keys, SDKs, webhooks, docs, and usage.", ["Overview:developers", "Apps:developer-apps", "API Keys:developer-api-keys", "Webhooks:developer-webhooks", "SDKs:developer-docs", "Docs:developer-docs", "Usage:developer-usage"], "noindex,nofollow"),
  shell("marketplace", "Marketplace", "developer", "public", "marketplace", "Reviewed apps, templates, plugins, and publisher workflows.", ["Browse:marketplace", "Installed:marketplace-installed", "Publisher:developers", "Reviews:admin-marketplace", "Categories:marketplace"], "index,follow"),
  shell("api", "API", "developer", "internal_service", "not-found", "API ingress only. This is not a frontend page shell.", ["Docs:developer-docs", "Status:status"], "noindex,nofollow"),
  shell("webhooks", "Webhooks", "developer", "internal_service", "not-found", "Webhook ingress only. Requests require provider signatures.", ["Docs:developer-docs", "Status:status"], "noindex,nofollow"),
  shell("admin", "Admin", "admin", "admin_access", "admin", "Administrative control plane.", ["Dashboard:admin", "Users:admin", "Workspaces:settings", "Billing:admin-billing", "Support:support", "Agents:admin-agents", "Marketplace:admin-marketplace", "Deployments:deployments", "Audit:admin-audit", "Security:admin-security", "Operations:admin-operations", "Settings:admin-settings"], "noindex,nofollow"),
  shell("console", "Console", "admin", "super_admin_access", "admin-operations", "Super-admin operations console.", ["Dashboard:admin-operations", "Health:admin-operations", "Queues:admin-operations", "Audit:admin-audit", "Security:admin-security"], "noindex,nofollow"),
  shell("deploy", "Deploy", "admin", "admin_access", "project-deployment", "Deployment controls and rollback shell.", ["Deployments:deployments", "Readiness:project-deployment", "Releases:project-release", "Audit:admin-audit"], "noindex,nofollow"),
  shell("events", "Events", "admin", "internal_service", "not-found", "Event ingestion only. Requests require API key or signature.", ["Docs:developer-docs", "Status:status"], "noindex,nofollow"),
  shell("docs", "Docs", "content", "public", "docs", "Documentation shell.", ["Overview:docs", "API:developer-docs", "Security:trust", "Support:support"], "index,follow"),
  shell("legal", "Legal", "content", "public", "legal", "Legal policy shell.", ["Terms:terms", "Privacy:privacy", "Cookies:cookies", "Refund:refund", "Plan Limits:plan-limits"], "index,follow"),
  shell("blog", "Blog", "content", "public", "changelog", "Product and engineering updates.", ["Latest:changelog", "Roadmap:roadmap", "Docs:docs"], "index,follow"),
  shell("learn", "Learn", "content", "public", "help", "Learning and onboarding content.", ["Guides:help", "Docs:docs", "Support:support"], "index,follow"),
  shell("releases", "Releases", "content", "authenticated", "project-release", "Release evidence and delivery reports.", ["Reports:project-release", "Docs:project-docs", "Deployments:deployments"], "noindex,nofollow"),
  shell("enterprise", "Enterprise", "content", "public", "trust", "Enterprise sales, security, procurement, and controls.", ["Overview:trust", "Contact:contact", "Security:security-page", "SLA:sla"], "index,follow"),
  shell("partners", "Partners", "content", "authenticated", "developers", "Partner and publisher workflows.", ["Overview:developers", "Publisher:developer-apps", "Marketplace:marketplace", "Support:support"], "noindex,nofollow"),
  shell("assets", "Assets", "asset", "public", "not-found", "Public immutable asset host.", ["Docs:docs"], "noindex,nofollow"),
  shell("cdn", "CDN", "asset", "public", "not-found", "CDN edge host.", ["Docs:docs"], "noindex,nofollow"),
  shell("uploads", "Uploads", "asset", "internal_service", "not-found", "Signed upload ingress only.", ["Files:project-files", "Docs:developer-docs"], "noindex,nofollow"),
  shell("files", "Files", "asset", "authenticated", "project-files", "Authorized file preview and download shell.", ["Files:project-files", "Diffs:project-diffs", "Docs:project-docs"], "noindex,nofollow")
];

export const SHARED_STATES: Record<DomainStateKind, { title: string; explanation: string; primaryAction: string; secondaryAction?: string; icon: typeof Loader2 }> = {
  loading: { title: "Loading workspace", explanation: "VaanForge is checking the current route and account context.", primaryAction: "Wait", icon: Loader2 },
  empty: { title: "Nothing here yet", explanation: "This shell is ready, but no records exist for this route yet.", primaryAction: "Create first item", secondaryAction: "View docs", icon: FileQuestion },
  error: { title: "Something went wrong", explanation: "The shell could not load the required route context.", primaryAction: "Retry", secondaryAction: "Contact support", icon: AlertTriangle },
  "permission-denied": { title: "Permission denied", explanation: "Your account does not have access to this VaanForge surface.", primaryAction: "Request access", secondaryAction: "Go to workspace", icon: Ban },
  "plan-limit": { title: "Plan limit reached", explanation: "This action requires a higher VaanForge plan.", primaryAction: "Upgrade plan", secondaryAction: "View limits", icon: CreditCard },
  "not-found": { title: "Route not found", explanation: "This subdomain does not serve that route.", primaryAction: "Go home", secondaryAction: "Open docs", icon: FileQuestion },
  maintenance: { title: "Maintenance mode", explanation: "This surface is temporarily paused for maintenance.", primaryAction: "View status", secondaryAction: "Contact support", icon: Wrench },
  offline: { title: "Offline", explanation: "The network is unavailable or the service cannot be reached.", primaryAction: "Retry", secondaryAction: "View status", icon: CloudOff },
  "session-expired": { title: "Session expired", explanation: "Sign in again to continue securely.", primaryAction: "Sign in", secondaryAction: "Go home", icon: ShieldAlert }
};

export function getViewerSession(): ViewerSession {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem("vf_session_state") : null;
  if (!raw) {
    return {
      authenticated: isLocalhost(),
      roles: isLocalhost() ? ["customer", "workspace_member", "developer", "admin", "super_admin", "support"] : [],
      workspaceMember: isLocalhost(),
      developer: isLocalhost(),
      billingActive: isLocalhost(),
      support: isLocalhost(),
      planLimited: false,
      expired: false
    };
  }
  try {
    return { ...JSON.parse(raw), roles: JSON.parse(raw).roles || [] } as ViewerSession;
  } catch {
    return { authenticated: false, roles: [], workspaceMember: false, developer: false, billingActive: false, support: false, planLimited: false, expired: false };
  }
}

export function shellForHost(hostname: string): ShellDefinition | undefined {
  const normalized = hostname.replace(/^www\./, "www.");
  return SHELL_DEFINITIONS.find((shellDef) => shellDef.host === normalized);
}

export function shellUrl(key: keyof typeof DOMAIN_URLS, path = "/") {
  const base = DOMAIN_URLS[key].replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

export function evaluateGuard(shellDef: ShellDefinition, session: ViewerSession): GuardResult {
  if (session.expired) {
    return { allowed: false, state: "session-expired", redirectUrl: shellUrl("auth", "/login"), reason: "Session expired." };
  }
  if (session.planLimited) {
    return { allowed: false, state: "plan-limit", redirectUrl: shellUrl("plans", "/upgrade"), reason: "Plan limit reached.", requiredPlan: "Professional" };
  }
  switch (shellDef.guard) {
    case "public":
      return { allowed: true };
    case "authenticated":
      return session.authenticated ? { allowed: true } : authRedirect();
    case "workspace_member":
      return session.authenticated && session.workspaceMember ? { allowed: true } : authOrDenied(session);
    case "billing_required":
      return session.authenticated && session.billingActive ? { allowed: true } : session.authenticated ? { allowed: false, state: "plan-limit", redirectUrl: shellUrl("plans", "/upgrade"), reason: "Billing plan required.", requiredPlan: "Creator" } : authRedirect();
    case "developer_access":
      return session.authenticated && session.developer ? { allowed: true } : authOrDenied(session);
    case "admin_access":
      return session.authenticated && (session.roles.includes("admin") || session.roles.includes("super_admin")) ? { allowed: true } : authOrDenied(session);
    case "super_admin_access":
      return session.authenticated && session.roles.includes("super_admin") ? { allowed: true } : authOrDenied(session);
    case "support_access":
      return session.authenticated && session.support ? { allowed: true } : authOrDenied(session);
    case "internal_service":
      return { allowed: false, state: "not-found", reason: "This domain is reserved for API, webhook, event, upload, or asset ingress." };
    default:
      return { allowed: false, state: "not-found", reason: "Unknown guard." };
  }
}

export function applyShellMetadata(shellDef: ShellDefinition) {
  if (typeof document === "undefined") return;
  document.title = `${shellDef.metadata.pageTitle} | ${shellDef.metadata.productTitle}`;
  setMeta("description", shellDef.metadata.description);
  setMeta("robots", shellDef.metadata.robots);
  setLink("canonical", shellDef.metadata.canonicalUrl);
  if (shellDef.metadata.openGraph) {
    setProperty("og:title", shellDef.metadata.openGraph.title);
    setProperty("og:description", shellDef.metadata.openGraph.description);
    setProperty("og:url", shellDef.metadata.openGraph.url);
  }
}

export function SubdomainShell({ shellDef, route, navigate, dark, toggleTheme }: PageProps & { shellDef: ShellDefinition }) {
  const session = getViewerSession();
  const guard = evaluateGuard(shellDef, session);
  const visibleNavigation = shellDef.navigation.filter((item) => !item.guard || evaluateGuard({ ...shellDef, guard: item.guard }, session).allowed);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <button onClick={() => navigate(shellDef.defaultRoute)} className="flex items-center gap-2 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Server size={15} /></span>
            <span>
              <span className="block text-sm font-semibold">VaanForge</span>
              <span className="block text-xs text-muted-foreground">{shellDef.label}</span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
            {visibleNavigation.map((item) => (
              <button key={`${item.route}-${item.label}`} onClick={() => navigate(item.route)} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${route === item.route ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <button onClick={toggleTheme} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted" aria-label="Toggle theme">
            {dark ? "Dark" : "Light"}
          </button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">{shellDef.kind}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{shellDef.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{shellDef.description}</p>
          <div className="mt-5 space-y-2 md:hidden">
            {visibleNavigation.map((item) => (
              <button key={`${item.route}-${item.label}-mobile`} onClick={() => navigate(item.route)} className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
                {item.label}<ArrowRight size={14} />
              </button>
            ))}
          </div>
        </aside>
        <div className="rounded-2xl border border-border bg-card p-6">
          {!guard.allowed ? <StatePanel kind={guard.state} actionUrl={guard.redirectUrl} reason={guard.reason} navigate={navigate} /> : <ReadyShell shellDef={shellDef} />}
        </div>
      </section>
    </main>
  );
}

function ReadyShell({ shellDef }: { shellDef: ShellDefinition }) {
  const feature = FEATURE_ENDPOINTS[shellDef.key];
  if (feature) return <FeatureShellContent shellDef={shellDef} feature={feature} />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 size={17} /></span>
        <div>
          <h2 className="text-lg font-semibold">Shell ready</h2>
          <p className="mt-1 text-sm text-muted-foreground">This subdomain is routed, guarded, and metadata-ready. Feature content is mounted when its backend contract is enabled for this surface.</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          ["Canonical", shellDef.metadata.canonicalUrl],
          ["Robots", shellDef.metadata.robots],
          ["Guard", shellDef.guard],
          ["Default route", shellDef.defaultRoute]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-all text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type FeatureEndpoint = { label: string; path: string; empty: string };
type FeatureConfig = { title: string; description: string; primaryAction: string; endpoints: FeatureEndpoint[] };
type FeatureRecord = { label: string; path: string; data?: unknown; error?: string; empty: string };

const FEATURE_ENDPOINTS: Record<string, FeatureConfig> = {
  app: {
    title: "Product home",
    description: "Projects, dashboard summary, activity, and usage are loaded from the app workspace APIs.",
    primaryAction: "New project",
    endpoints: [
      { label: "Dashboard", path: "/dashboard/summary", empty: "Dashboard summary appears after workspace activity." },
      { label: "Projects", path: "/projects", empty: "Create your first project to start a VaanForge workflow." },
      { label: "Billing usage", path: "/billing/usage", empty: "Usage appears after project or agent activity." }
    ]
  },
  factory: {
    title: "Factory workflow",
    description: "The factory shell follows locked steps from project intake through blueprint, design, build, QA, release, docs, and memory.",
    primaryAction: "Continue workflow",
    endpoints: [
      { label: "Projects", path: "/factory/projects", empty: "No factory projects exist yet." },
      { label: "Quality", path: "/admin/factory/quality", empty: "Quality reports appear after factory runs." },
      { label: "Reviews", path: "/admin/factory/reviews", empty: "Approvals appear when blueprints, designs, or releases are generated." },
      { label: "Memory", path: "/admin/factory/memory", empty: "Factory memory appears after releases or rejected outputs." }
    ]
  },
  agents: {
    title: "Agent control plane",
    description: "Agent runs, roles, brains, logs, outputs, and handoffs come from persisted VaanForge run services.",
    primaryAction: "Start run",
    endpoints: [
      { label: "Runs", path: "/agents/runs", empty: "No agent runs have started yet." },
      { label: "Roles", path: "/agents/roles", empty: "Agent roles initialize when the team engine is opened." },
      { label: "Brains", path: "/agents/brains", empty: "Agent brain configs appear after roles are initialized." }
    ]
  },
  profile: {
    title: "Account overview",
    description: "Profile, sessions, usage, billing, API keys, and personal activity are loaded from account APIs.",
    primaryAction: "Update profile",
    endpoints: [
      { label: "Profile", path: "/profile", empty: "Complete your profile to personalize VaanForge." },
      { label: "Sessions", path: "/profile/sessions", empty: "No active sessions are available for this account." },
      { label: "Usage", path: "/profile/usage-summary", empty: "Usage appears after project, agent, or billing activity." },
      { label: "Billing", path: "/profile/billing-summary", empty: "Billing summary appears after subscription activity." },
      { label: "API keys", path: "/profile/api-keys-summary", empty: "Create an API key when external access is needed." },
      { label: "Activity", path: "/profile/activity", empty: "Account activity will appear after audited actions." }
    ]
  },
  settings: {
    title: "Workspace settings",
    description: "Account, workspace, team, security, integrations, and notification settings persist through backend APIs.",
    primaryAction: "Open settings",
    endpoints: [
      { label: "Account", path: "/settings/account", empty: "Account settings are ready for configuration." },
      { label: "Workspace", path: "/settings/workspace", empty: "Create a workspace to manage shared settings." },
      { label: "Team", path: "/settings/team", empty: "Invite teammates when your plan allows it." },
      { label: "Billing", path: "/settings/billing", empty: "Billing state appears after subscription activity." },
      { label: "Usage", path: "/settings/usage", empty: "Usage appears after product activity." },
      { label: "API keys", path: "/settings/api-keys", empty: "API keys appear after creation." }
    ]
  },
  plans: {
    title: "Plans and limits",
    description: "Pricing, yearly discounts, GST notes, and limits are sourced from the billing plan API.",
    primaryAction: "Compare plans",
    endpoints: [
      { label: "Plans", path: "/billing/plans", empty: "No active plans are published yet." }
    ]
  },
  support: {
    title: "Support center",
    description: "Tickets, announcements, knowledge base articles, and status are backed by support APIs.",
    primaryAction: "Create ticket",
    endpoints: [
      { label: "Tickets", path: "/support/tickets", empty: "No support tickets yet. Create one when you need help." },
      { label: "Announcements", path: "/support/announcements", empty: "No published announcements right now." },
      { label: "Knowledge base", path: "/support/kb", empty: "Knowledge base articles will appear after publishing." },
      { label: "Status", path: "/support/status", empty: "Status is available when support services report." }
    ]
  },
  admin: {
    title: "Admin support center",
    description: "Support queue, ticket triage, assignments, reports, KB, and announcements require admin support permission.",
    primaryAction: "Review tickets",
    endpoints: [
      { label: "Dashboard", path: "/admin/support/dashboard", empty: "No support metrics yet." },
      { label: "Tickets", path: "/admin/support/tickets", empty: "No customer tickets are waiting." },
      { label: "Reports", path: "/admin/support/reports", empty: "Reports appear after support activity exists." },
      { label: "Providers", path: "/admin/providers/readiness", empty: "Provider readiness appears after admin access is confirmed." }
    ]
  },
  developers: {
    title: "Developer portal",
    description: "Developer apps, API keys, webhooks, SDK metadata, usage, and logs are loaded from KDP APIs.",
    primaryAction: "Create app",
    endpoints: [
      { label: "Dashboard", path: "/developers/dashboard", empty: "Developer dashboard appears after account initialization." },
      { label: "Apps", path: "/developers/apps", empty: "Create your first developer app." },
      { label: "API keys", path: "/developers/api-keys", empty: "Create an API key after creating an app." },
      { label: "Webhooks", path: "/developers/webhooks", empty: "Create a webhook to receive lifecycle events." },
      { label: "SDK", path: "/developers/sdk", empty: "SDK metadata appears after developer access is initialized." },
      { label: "Usage", path: "/developers/usage", empty: "Usage logs appear after API requests." },
      { label: "Logs", path: "/developers/logs", empty: "Developer logs appear after gateway or webhook actions." }
    ]
  },
  marketplace: {
    title: "Marketplace",
    description: "Published apps, categories, installs, publisher revenue, and review state are loaded from marketplace APIs.",
    primaryAction: "Browse apps",
    endpoints: [
      { label: "Apps", path: "/marketplace/apps", empty: "No reviewed marketplace apps are published yet." },
      { label: "Categories", path: "/marketplace/categories", empty: "Categories appear after reviewed apps are published." },
      { label: "Installed", path: "/marketplace/installs", empty: "Installed apps appear after a workspace install." },
      { label: "Publisher", path: "/marketplace/publisher", empty: "Create a publisher profile before submitting apps." }
    ]
  },
  docs: {
    title: "Documentation",
    description: "Docs are sourced from repository-backed markdown or managed docs records.",
    primaryAction: "Search docs",
    endpoints: [
      { label: "Articles", path: "/docs", empty: "Documentation appears after repository docs or managed articles are published." },
      { label: "Categories", path: "/docs/categories", empty: "Documentation categories appear with published articles." },
      { label: "Search", path: "/docs/search?q=security", empty: "Search returns published docs only." }
    ]
  },
  status: {
    title: "System status",
    description: "Status services, incidents, history, and monitoring readiness are loaded from status APIs.",
    primaryAction: "View incidents",
    endpoints: [
      { label: "Overview", path: "/status", empty: "Status appears when services are registered." },
      { label: "Services", path: "/status/services", empty: "Services appear after status registration." },
      { label: "Incidents", path: "/status/incidents", empty: "No incidents are currently recorded." },
      { label: "History", path: "/status/history", empty: "Resolved incidents and health checks appear here." }
    ]
  },
  legal: {
    title: "Legal",
    description: "Versioned KRAVIA PRIVATE LIMITED policy pages are served from managed legal records.",
    primaryAction: "Review terms",
    endpoints: [
      { label: "Pages", path: "/legal/pages", empty: "Legal pages appear after managed publication." },
      { label: "Terms", path: "/legal/pages/terms-of-use", empty: "Terms are published through legal page management." },
      { label: "Privacy", path: "/legal/pages/privacy-policy", empty: "Privacy policy is published through legal page management." }
    ]
  },
  releases: {
    title: "Releases",
    description: "Release notes and changelog entries are versioned and tied to repository release records.",
    primaryAction: "Read changelog",
    endpoints: [
      { label: "Releases", path: "/releases", empty: "Published releases appear here." },
      { label: "Changelog", path: "/releases/changelog", empty: "Changelog entries appear after a release is published." }
    ]
  },
  enterprise: {
    title: "Enterprise",
    description: "Enterprise sales, solution, and security content use backend-backed lead and content records.",
    primaryAction: "Contact sales",
    endpoints: [
      { label: "Solutions", path: "/enterprise/solutions", empty: "Enterprise solution pages appear after publication." },
      { label: "Security", path: "/enterprise/security", empty: "Security material appears after publication." }
    ]
  },
  partners: {
    title: "Partners",
    description: "Partner applications, resources, referrals, commissions, and payouts are backed by partner records.",
    primaryAction: "Apply",
    endpoints: [
      { label: "Resources", path: "/partners/resources", empty: "Partner resources appear after publication." },
      { label: "Profile", path: "/partners/profile", empty: "Apply and get approved before a partner profile appears." },
      { label: "Referrals", path: "/partners/referrals", empty: "Referrals appear after partner activity." },
      { label: "Commissions", path: "/partners/commissions", empty: "Commissions appear after converted revenue events." },
      { label: "Payouts", path: "/partners/payouts", empty: "Payouts appear after approved commissions." }
    ]
  }
};

function FeatureShellContent({ shellDef, feature }: { shellDef: ShellDefinition; feature: FeatureConfig }) {
  const [records, setRecords] = useState<FeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.allSettled(feature.endpoints.map((endpoint) => apiClient<unknown>(endpoint.path))).then((results) => {
      if (!mounted) return;
      setRecords(results.map((result, index) => {
        const endpoint = feature.endpoints[index];
        return result.status === "fulfilled"
          ? { label: endpoint.label, path: endpoint.path, data: result.value, empty: endpoint.empty }
          : { label: endpoint.label, path: endpoint.path, error: result.reason instanceof Error ? result.reason.message : "Request failed", empty: endpoint.empty };
      }));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [feature]);

  const healthy = useMemo(() => records.filter((record) => !record.error).length, [records]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Loader2 size={17} className="animate-spin" /></span>
          <div>
            <h2 className="text-lg font-semibold">Loading {shellDef.label.toLowerCase()}</h2>
            <p className="text-sm text-muted-foreground">Fetching backend-backed account data.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {feature.endpoints.map((endpoint) => <div key={endpoint.path} className="h-24 animate-pulse rounded-xl border border-border bg-muted/50" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary">{shellDef.host}</p>
          <h2 className="mt-2 text-lg font-semibold">{feature.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{feature.description}</p>
        </div>
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{feature.primaryAction}</button>
      </div>
      <div className="mt-5 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
        {healthy} of {records.length} backend contracts responded successfully.
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {records.map((record) => (
          <article key={record.path} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{record.label}</h3>
                <p className="mt-1 break-all text-xs text-muted-foreground">{record.path}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[11px] ${record.error ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                {record.error ? "Needs attention" : "Live"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{record.error || summarizeValue(record.data, record.empty)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function summarizeValue(value: unknown, empty: string) {
  if (Array.isArray(value)) return value.length ? `${value.length} records available.` : empty;
  if (!value) return empty;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (!keys.length) return empty;
    return `${keys.slice(0, 4).join(", ")}${keys.length > 4 ? ` and ${keys.length - 4} more fields` : ""}.`;
  }
  return String(value);
}

function StatePanel({ kind, actionUrl, reason, navigate }: { kind: DomainStateKind; actionUrl?: string; reason?: string; navigate: (route: string) => void }) {
  const state = SHARED_STATES[kind];
  const Icon = state.icon;
  return (
    <div className="flex max-w-xl flex-col items-start">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon size={18} className={kind === "loading" ? "animate-spin" : ""} /></span>
      <h2 className="mt-4 text-xl font-semibold">{state.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{reason || state.explanation}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => actionUrl ? window.location.assign(actionUrl) : navigate("workspace")} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{state.primaryAction}</button>
        {state.secondaryAction && <button onClick={() => navigate("support")} className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">{state.secondaryAction}</button>}
      </div>
    </div>
  );
}

function shell(key: keyof typeof DOMAIN_URLS, label: string, kind: ShellKind, guard: DomainGuard, defaultRoute: string, description: string, navItems: string[], robots: DomainMetadata["robots"]): ShellDefinition {
  const canonicalUrl = DOMAIN_URLS[key];
  return {
    key,
    host: new URL(canonicalUrl).hostname,
    label,
    kind,
    guard,
    defaultRoute,
    description,
    navigation: navItems.map((item) => {
      const [navLabel, route] = item.split(":");
      return { label: navLabel, route };
    }),
    metadata: {
      productTitle: "VaanForge",
      pageTitle: `${label} Shell`,
      description,
      canonicalUrl,
      robots,
      openGraph: robots === "index,follow" ? { title: `VaanForge ${label}`, description, url: canonicalUrl } : undefined
    },
    state: "empty"
  };
}

function authRedirect(): GuardResult {
  return { allowed: false, state: "session-expired", redirectUrl: shellUrl("auth", "/login"), reason: "Authentication is required for this VaanForge domain." };
}

function authOrDenied(session: ViewerSession): GuardResult {
  return session.authenticated
    ? { allowed: false, state: "permission-denied", reason: "Your account is signed in but does not have the required role for this subdomain." }
    : authRedirect();
}

function urlFromEnv(name: string, fallbackHost: string) {
  const value = (import.meta.env[name] as string | undefined) || "";
  return value || `https://${fallbackHost}`;
}

function envValue(name: string, fallback: string) {
  return (import.meta.env[name] as string | undefined) || fallback;
}

function isLocalhost() {
  return typeof window !== "undefined" && isLocalhostHost(window.location.hostname);
}

function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function setMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}
