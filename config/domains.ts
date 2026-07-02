export type VaanForgeDomainVisibility = "public" | "protected" | "internal";
export type VaanForgeDomainStatus = "active" | "planned" | "future";
export type VaanForgeAppType =
  | "marketing"
  | "workspace"
  | "auth"
  | "account"
  | "billing"
  | "admin"
  | "docs"
  | "developer"
  | "marketplace"
  | "api"
  | "asset"
  | "webhook"
  | "event"
  | "factory"
  | "operations"
  | "deployment"
  | "legal"
  | "content"
  | "partner";

export type VaanForgeDeploymentTarget =
  | "frontend-edge"
  | "backend-api"
  | "object-storage-cdn"
  | "webhook-ingress"
  | "event-ingress"
  | "operations-console";

export interface VaanForgeDomainConfig {
  key: string;
  domain: string;
  purpose: string;
  appType: VaanForgeAppType;
  visibility: VaanForgeDomainVisibility;
  requiredAuth: "none" | "user" | "admin" | "super_admin" | "api_key" | "signature";
  allowedRoles: string[];
  apiOriginAllowed: boolean;
  cookieAccessRequired: boolean;
  deploymentTarget: VaanForgeDeploymentTarget;
  status: VaanForgeDomainStatus;
}

export const VAANFORGE_ROOT_DOMAIN = "vaanforge.com";

export const vaanforgeDomains: VaanForgeDomainConfig[] = [
  domain("root", "vaanforge.com", "Primary product entry and workspace landing shell.", "workspace", "public", "none", ["anonymous", "customer"], true, false, "frontend-edge", "active"),
  domain("www", "www.vaanforge.com", "Canonical public alias for the primary product entry.", "marketing", "public", "none", ["anonymous"], true, false, "frontend-edge", "active"),
  domain("app", "app.vaanforge.com", "Authenticated builder workspace and project factory.", "workspace", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "frontend-edge", "active"),
  domain("auth", "auth.vaanforge.com", "Login, registration, password reset, and verification flows.", "auth", "public", "none", ["anonymous", "customer"], true, true, "frontend-edge", "active"),
  domain("profile", "profile.vaanforge.com", "User profile, sessions, devices, and account identity controls.", "account", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "frontend-edge", "planned"),
  domain("settings", "settings.vaanforge.com", "Workspace, team, security, and product settings.", "account", "protected", "user", ["owner", "admin"], true, true, "frontend-edge", "planned"),
  domain("plans", "plans.vaanforge.com", "Plan comparison and authenticated plan management.", "billing", "public", "none", ["anonymous", "customer"], true, false, "frontend-edge", "active"),
  domain("support", "support.vaanforge.com", "Support tickets, help workflows, and customer success entry.", "content", "protected", "user", ["customer", "support", "admin"], true, true, "frontend-edge", "planned"),
  domain("admin", "admin.vaanforge.com", "Administrative control plane for billing, security, operations, and reviews.", "admin", "protected", "admin", ["admin", "super_admin"], true, true, "operations-console", "active"),
  domain("docs", "docs.vaanforge.com", "Product documentation, API guides, and implementation references.", "docs", "public", "none", ["anonymous", "developer", "customer"], true, false, "frontend-edge", "active"),
  domain("status", "status.vaanforge.com", "Public status and incident communication.", "operations", "public", "none", ["anonymous"], true, false, "frontend-edge", "planned"),
  domain("developers", "developers.vaanforge.com", "Developer portal, API keys, SDKs, apps, plugins, and usage.", "developer", "protected", "user", ["developer", "workspace_member", "admin"], true, true, "frontend-edge", "active"),
  domain("marketplace", "marketplace.vaanforge.com", "Reviewed apps, templates, plugins, integrations, and installs.", "marketplace", "public", "none", ["anonymous", "customer", "publisher"], true, false, "frontend-edge", "active"),
  domain("api", "api.vaanforge.com", "Versioned REST API ingress.", "api", "protected", "user", ["customer", "developer", "admin", "service"], false, true, "backend-api", "active"),
  domain("assets", "assets.vaanforge.com", "Versioned public design assets and immutable static files.", "asset", "public", "none", ["anonymous"], false, false, "object-storage-cdn", "planned"),
  domain("cdn", "cdn.vaanforge.com", "CDN edge for optimized public media and static bundles.", "asset", "public", "none", ["anonymous"], false, false, "object-storage-cdn", "planned"),
  domain("uploads", "uploads.vaanforge.com", "Signed upload ingress for customer files.", "asset", "protected", "user", ["customer", "workspace_member"], false, true, "object-storage-cdn", "planned"),
  domain("files", "files.vaanforge.com", "Authorized file download and preview surface.", "asset", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "object-storage-cdn", "planned"),
  domain("webhooks", "webhooks.vaanforge.com", "External webhook ingress protected by signature verification.", "webhook", "internal", "signature", ["external_provider", "service"], false, false, "webhook-ingress", "active"),
  domain("events", "events.vaanforge.com", "Event ingestion and delivery endpoints for integrations.", "event", "internal", "api_key", ["service", "developer"], false, false, "event-ingress", "planned"),
  domain("billing", "billing.vaanforge.com", "Customer billing dashboard, invoices, usage, credits, and subscriptions.", "billing", "protected", "user", ["customer", "billing_admin", "admin"], true, true, "frontend-edge", "active"),
  domain("checkout", "checkout.vaanforge.com", "Checkout session handoff and payment status pages.", "billing", "protected", "user", ["customer"], true, true, "frontend-edge", "active"),
  domain("console", "console.vaanforge.com", "KRAVIA operations console for platform control.", "operations", "protected", "super_admin", ["super_admin"], true, true, "operations-console", "planned"),
  domain("factory", "factory.vaanforge.com", "Autonomous software factory project execution workspace.", "factory", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "frontend-edge", "active"),
  domain("agents", "agents.vaanforge.com", "Agent run monitoring, roles, approvals, and execution logs.", "factory", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "frontend-edge", "planned"),
  domain("deploy", "deploy.vaanforge.com", "Deployment manager, readiness checks, health checks, and rollback controls.", "deployment", "protected", "admin", ["admin", "deployment_admin", "super_admin"], true, true, "operations-console", "planned"),
  domain("releases", "releases.vaanforge.com", "Release notes, changelogs, version reports, and delivery evidence.", "deployment", "protected", "user", ["customer", "workspace_member", "admin"], true, true, "frontend-edge", "planned"),
  domain("legal", "legal.vaanforge.com", "Terms, privacy, refund, cookies, acceptable use, and plan-limit policy.", "legal", "public", "none", ["anonymous"], true, false, "frontend-edge", "active"),
  domain("feedback", "feedback.vaanforge.com", "Customer feedback and product request capture.", "content", "protected", "user", ["customer", "workspace_member"], true, true, "frontend-edge", "future"),
  domain("learn", "learn.vaanforge.com", "Learning guides, tutorials, and onboarding content.", "content", "public", "none", ["anonymous", "customer"], true, false, "frontend-edge", "future"),
  domain("blog", "blog.vaanforge.com", "Product updates and engineering articles.", "content", "public", "none", ["anonymous"], true, false, "frontend-edge", "future"),
  domain("partners", "partners.vaanforge.com", "Partner portal, publisher onboarding, and revenue workflows.", "partner", "protected", "user", ["partner", "publisher", "admin"], true, true, "frontend-edge", "planned"),
  domain("enterprise", "enterprise.vaanforge.com", "Enterprise sales, security review, procurement, and account controls.", "partner", "public", "none", ["anonymous", "enterprise_customer"], true, false, "frontend-edge", "planned")
];

export const allowedBrowserOrigins = vaanforgeDomains
  .filter((item) => item.apiOriginAllowed)
  .map((item) => `https://${item.domain}`);

export const adminOrigins = vaanforgeDomains
  .filter((item) => item.requiredAuth === "admin" || item.requiredAuth === "super_admin")
  .map((item) => `https://${item.domain}`);

export const webhookDomains = vaanforgeDomains.filter((item) => item.appType === "webhook" || item.appType === "event");

function domain(
  key: string,
  domainName: string,
  purpose: string,
  appType: VaanForgeAppType,
  visibility: VaanForgeDomainVisibility,
  requiredAuth: VaanForgeDomainConfig["requiredAuth"],
  allowedRoles: string[],
  apiOriginAllowed: boolean,
  cookieAccessRequired: boolean,
  deploymentTarget: VaanForgeDeploymentTarget,
  status: VaanForgeDomainStatus
): VaanForgeDomainConfig {
  return {
    key,
    domain: domainName,
    purpose,
    appType,
    visibility,
    requiredAuth,
    allowedRoles,
    apiOriginAllowed,
    cookieAccessRequired,
    deploymentTarget,
    status
  };
}
