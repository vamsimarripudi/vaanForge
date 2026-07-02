import { lazy, Suspense, useState, useEffect } from "react";
import { applyShellMetadata, evaluateGuard, getViewerSession, shellForHost, shellUrl, SubdomainShell } from "./domainShells";

const BrandAssets = lazy(() => import("./BrandAssets"));
const WorkspaceApp = lazy(() => import("./Workspace").then((module) => ({ default: module.WorkspaceApp })));
const PublicSite = lazy(() => import("./PublicPages").then((module) => ({ default: module.PublicSite })));
const LegalSite = lazy(() => import("./LegalPages").then((module) => ({ default: module.LegalSite })));

export interface PageProps {
  route: string;
  navigate: (r: string) => void;
  dark: boolean;
  toggleTheme: () => void;
}

const APP_ROUTES = new Set([
  "workspace", "projects", "factory", "builds",
  "validations", "deployments", "pricing", "settings",
  "onboarding", "product-tours", "command-palette", "global-search",
  "notifications", "automation", "workspace-analytics", "product-health",
  "admin-releases", "admin-release-detail", "admin-monitoring", "admin-monitoring-services",
  "admin-monitoring-queues", "admin-monitoring-errors", "admin-monitoring-providers",
  "admin-alerts", "admin-customer-success", "admin-customer-account",
  "admin-executive", "admin-business-crm", "admin-business-finance",
  "admin-business-subscriptions", "admin-business-ai-costs",
  "admin-business-infrastructure", "admin-business-reports",
  "admin-engineering", "admin-engineering-projects", "admin-engineering-architecture",
  "admin-engineering-quality", "admin-engineering-debt", "admin-engineering-releases",
  "admin-engineering-environments", "admin-engineering-database",
  "admin-engineering-analytics", "admin-engineering-governance",
  "admin-engineering-admin-tools",
  "feedback", "feedback-feature-requests", "feedback-bug-reports", "feedback-roadmap",
  "profile", "project-detail", "project-chat", "project-intake",
  "project-questions", "project-blueprint", "project-design",
  "project-tasks", "project-agents", "project-files",
  "project-diffs", "project-qa", "project-security",
  "project-deployment", "project-release", "project-docs",
  "project-memory", "billing", "billing-checkout",
  "billing-result", "billing-subscription", "billing-invoices",
  "billing-usage", "billing-credits", "marketplace",
  "marketplace-detail", "marketplace-installed", "developers",
  "developer-apps", "developer-api-keys", "developer-webhooks",
  "developer-docs", "developer-usage", "admin", "admin-agents",
  "admin-billing", "admin-marketplace", "admin-operations",
  "admin-audit", "admin-audit-exports", "admin-security",
  "admin-security-events", "admin-security-risk", "admin-security-sessions",
  "admin-security-api-keys", "admin-security-reports", "admin-privacy",
  "settings-security", "settings-data-privacy", "developer-api-key-security",
  "admin-settings",
]);
const PUBLIC_ROUTES = new Set([
  "about", "contact", "status", "docs",
  "help", "support", "changelog", "roadmap", "trust",
  "login", "register", "forgot-password", "verify-email",
]);
const LEGAL_ROUTES = new Set([
  "legal", "terms", "privacy", "cookies", "security-page",
  "refund", "acceptable-use", "data-processing",
  "subprocessors", "sla", "accessibility",
  "plan-limits",
]);

export default function App() {
  const [route, setRoute] = useState(routeFromPath(window.location.pathname));
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const syncRoute = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const navigate = (nextRoute: string) => {
    const path = pathFromRoute(nextRoute);
    window.history.pushState({}, "", path);
    setRoute(nextRoute);
  };

  const props: PageProps = {
    route,
    navigate,
    dark,
    toggleTheme: () => setDark((d) => !d),
  };
  const shellDef = shellForHost(window.location.hostname);

  useEffect(() => {
    if (!shellDef) return;
    applyShellMetadata(shellDef);
    const session = getViewerSession();
    const guard = evaluateGuard(shellDef, session);
    if (shellDef.key === "auth" && session.authenticated && !isLocalhostHost(window.location.hostname)) {
      window.location.assign(shellUrl("app"));
      return;
    }
    if (!guard.allowed && guard.redirectUrl && !isLocalhostHost(window.location.hostname)) {
      window.location.assign(guard.redirectUrl);
    }
  }, [shellDef]);

  return (
    <div
      className={dark ? "dark" : ""}
      style={{ fontFamily: "'Onest', 'Instrument Sans', system-ui, sans-serif" }}
    >
      <Suspense fallback={<AppLoading />}>
        {shellDef && <SubdomainShell {...props} shellDef={shellDef} />}
        {!shellDef && (
          <>
        {route === "brand" && <BrandAssets />}
        {APP_ROUTES.has(route) && <WorkspaceApp {...props} />}
        {PUBLIC_ROUTES.has(route) && <PublicSite {...props} />}
        {LEGAL_ROUTES.has(route) && <LegalSite {...props} />}
          </>
        )}
      </Suspense>
    </div>
  );
}

function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function AppLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Loading VaanForge
      </div>
    </div>
  );
}

function routeFromPath(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return "workspace";
  if (clean === "app/onboarding" || clean === "builder/onboarding" || clean === "onboarding") return "onboarding";
  if (clean === "app/tours" || clean === "product-tours") return "product-tours";
  if (clean === "app/command-palette" || clean === "command-palette") return "command-palette";
  if (clean === "app/search" || clean === "search") return "global-search";
  if (clean === "app/notifications" || clean === "notifications") return "notifications";
  if (clean === "app/automation" || clean === "automation") return "automation";
  if (clean === "app/analytics" || clean === "workspace-analytics") return "workspace-analytics";
  if (clean === "app/health" || clean === "product-health") return "product-health";
  if (clean === "admin/releases") return "admin-releases";
  if (clean.startsWith("admin/releases/")) return "admin-release-detail";
  if (clean === "admin/monitoring") return "admin-monitoring";
  if (clean === "admin/monitoring/services") return "admin-monitoring-services";
  if (clean === "admin/monitoring/queues") return "admin-monitoring-queues";
  if (clean === "admin/monitoring/errors") return "admin-monitoring-errors";
  if (clean === "admin/monitoring/providers") return "admin-monitoring-providers";
  if (clean === "admin/alerts") return "admin-alerts";
  if (clean === "admin/customer-success") return "admin-customer-success";
  if (clean.startsWith("admin/customer-success/accounts/")) return "admin-customer-account";
  if (clean === "admin/executive") return "admin-executive";
  if (clean === "admin/business/crm") return "admin-business-crm";
  if (clean === "admin/business/finance") return "admin-business-finance";
  if (clean === "admin/business/subscriptions") return "admin-business-subscriptions";
  if (clean === "admin/business/ai-costs") return "admin-business-ai-costs";
  if (clean === "admin/business/infrastructure") return "admin-business-infrastructure";
  if (clean === "admin/business/reports") return "admin-business-reports";
  if (clean === "admin/engineering") return "admin-engineering";
  if (clean === "admin/engineering/projects") return "admin-engineering-projects";
  if (clean === "admin/engineering/architecture") return "admin-engineering-architecture";
  if (clean === "admin/engineering/quality") return "admin-engineering-quality";
  if (clean === "admin/engineering/technical-debt") return "admin-engineering-debt";
  if (clean === "admin/engineering/release-pipeline") return "admin-engineering-releases";
  if (clean === "admin/engineering/environments") return "admin-engineering-environments";
  if (clean === "admin/engineering/database") return "admin-engineering-database";
  if (clean === "admin/engineering/analytics") return "admin-engineering-analytics";
  if (clean === "admin/engineering/governance") return "admin-engineering-governance";
  if (clean === "admin/engineering/admin-tools") return "admin-engineering-admin-tools";
  if (clean === "feedback") return "feedback";
  if (clean === "feedback/feature-requests") return "feedback-feature-requests";
  if (clean === "feedback/bug-reports") return "feedback-bug-reports";
  if (clean === "feedback/roadmap") return "feedback-roadmap";
  if (clean === "builder" || clean === "builder/projects" || clean === "builder/projects/new") return "projects";
  if (clean === "docs") return "docs";
  if (clean === "login" || clean === "register" || clean === "forgot-password" || clean === "verify-email") return clean;
  if (clean === "legal/privacy-policy") return "privacy";
  if (clean === "legal/terms-of-use") return "terms";
  if (clean === "legal/refund-cancellation-policy") return "refund";
  if (clean === "legal/plan-limits") return "plan-limits";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/chat")) return "project-chat";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/intake")) return "project-intake";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/questions")) return "project-questions";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/blueprint")) return "project-blueprint";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/design")) return "project-design";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/tasks")) return "project-tasks";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/agents")) return "project-agents";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/files")) return "project-files";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/diffs")) return "project-diffs";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/qa")) return "project-qa";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/security")) return "project-security";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/deployment")) return "project-deployment";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/release")) return "project-release";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/docs")) return "project-docs";
  if (clean.startsWith("builder/projects/") && clean.endsWith("/memory")) return "project-memory";
  if (clean.startsWith("builder/projects/")) return "project-detail";
  if (clean.startsWith("builder/factory")) return "factory";
  if (clean === "builder/billing") return "billing";
  if (clean === "builder/billing/plans") return "pricing";
  if (clean === "builder/billing/checkout") return "billing-checkout";
  if (clean === "builder/billing/payment-success" || clean === "builder/billing/payment-failed") return "billing-result";
  if (clean === "builder/billing/subscription") return "billing-subscription";
  if (clean === "builder/billing/invoices") return "billing-invoices";
  if (clean === "builder/billing/usage") return "billing-usage";
  if (clean === "builder/billing/credits") return "billing-credits";
  if (clean === "marketplace") return "marketplace";
  if (clean.startsWith("marketplace/apps/")) return "marketplace-detail";
  if (clean === "marketplace/installed") return "marketplace-installed";
  if (clean === "developers") return "developers";
  if (clean === "developers/apps") return "developer-apps";
  if (clean === "developers/api-keys") return "developer-api-keys";
  if (clean === "developers/webhooks") return "developer-webhooks";
  if (clean === "developers/docs") return "developer-docs";
  if (clean === "developers/usage") return "developer-usage";
  if (clean === "admin") return "admin";
  if (clean === "admin/factory") return "factory";
  if (clean === "admin/agents") return "admin-agents";
  if (clean === "admin/billing") return "admin-billing";
  if (clean === "admin/marketplace") return "admin-marketplace";
  if (clean === "admin/operations") return "admin-operations";
  if (clean === "admin/audit") return "admin-audit";
  if (clean === "admin/audit/exports") return "admin-audit-exports";
  if (clean === "admin/security") return "admin-security";
  if (clean === "admin/security/events") return "admin-security-events";
  if (clean === "admin/security/risk") return "admin-security-risk";
  if (clean === "admin/security/sessions") return "admin-security-sessions";
  if (clean === "admin/security/api-keys") return "admin-security-api-keys";
  if (clean === "admin/security/reports") return "admin-security-reports";
  if (clean === "admin/privacy") return "admin-privacy";
  if (clean === "settings/security") return "settings-security";
  if (clean === "settings/data-privacy") return "settings-data-privacy";
  if (clean.startsWith("developers/api-keys/") && clean.endsWith("/security")) return "developer-api-key-security";
  if (clean === "admin/settings") return "admin-settings";
  if (clean.startsWith("admin/agent/workspace")) return "builds";
  if (clean === "security") return "security-page";
  if (clean === "cookie-policy") return "cookies";
  if (clean === "refund-policy") return "refund";
  if (APP_ROUTES.has(clean) || PUBLIC_ROUTES.has(clean) || LEGAL_ROUTES.has(clean) || clean === "brand") return clean;
  return "workspace";
}

function pathFromRoute(route: string) {
  const map: Record<string, string> = {
    workspace: "/",
    onboarding: "/onboarding",
    "product-tours": "/app/tours",
    "command-palette": "/app/command-palette",
    "global-search": "/app/search",
    notifications: "/app/notifications",
    automation: "/app/automation",
    "workspace-analytics": "/app/analytics",
    "product-health": "/app/health",
    "admin-releases": "/admin/releases",
    "admin-release-detail": "/admin/releases/release",
    "admin-monitoring": "/admin/monitoring",
    "admin-monitoring-services": "/admin/monitoring/services",
    "admin-monitoring-queues": "/admin/monitoring/queues",
    "admin-monitoring-errors": "/admin/monitoring/errors",
    "admin-monitoring-providers": "/admin/monitoring/providers",
    "admin-alerts": "/admin/alerts",
    "admin-customer-success": "/admin/customer-success",
    "admin-customer-account": "/admin/customer-success/accounts/account",
    "admin-executive": "/admin/executive",
    "admin-business-crm": "/admin/business/crm",
    "admin-business-finance": "/admin/business/finance",
    "admin-business-subscriptions": "/admin/business/subscriptions",
    "admin-business-ai-costs": "/admin/business/ai-costs",
    "admin-business-infrastructure": "/admin/business/infrastructure",
    "admin-business-reports": "/admin/business/reports",
    "admin-engineering": "/admin/engineering",
    "admin-engineering-projects": "/admin/engineering/projects",
    "admin-engineering-architecture": "/admin/engineering/architecture",
    "admin-engineering-quality": "/admin/engineering/quality",
    "admin-engineering-debt": "/admin/engineering/technical-debt",
    "admin-engineering-releases": "/admin/engineering/release-pipeline",
    "admin-engineering-environments": "/admin/engineering/environments",
    "admin-engineering-database": "/admin/engineering/database",
    "admin-engineering-analytics": "/admin/engineering/analytics",
    "admin-engineering-governance": "/admin/engineering/governance",
    "admin-engineering-admin-tools": "/admin/engineering/admin-tools",
    feedback: "/feedback",
    "feedback-feature-requests": "/feedback/feature-requests",
    "feedback-bug-reports": "/feedback/bug-reports",
    "feedback-roadmap": "/feedback/roadmap",
    projects: "/builder/projects",
    factory: "/builder/factory",
    builds: "/admin/agent/workspace",
    validations: "/validations",
    deployments: "/deployments",
    pricing: "/pricing",
    settings: "/settings",
    "settings-security": "/settings/security",
    "settings-data-privacy": "/settings/data-privacy",
    profile: "/profile",
    "admin-audit": "/admin/audit",
    "admin-audit-exports": "/admin/audit/exports",
    "admin-security": "/admin/security",
    "admin-security-events": "/admin/security/events",
    "admin-security-risk": "/admin/security/risk",
    "admin-security-sessions": "/admin/security/sessions",
    "admin-security-api-keys": "/admin/security/api-keys",
    "admin-security-reports": "/admin/security/reports",
    "admin-privacy": "/admin/privacy",
    "developer-api-key-security": "/developers/api-keys/key/security",
    "security-page": "/security",
    cookies: "/cookie-policy",
    refund: "/refund-policy",
    brand: "/brand"
  };
  return map[route] || `/${route}`;
}
