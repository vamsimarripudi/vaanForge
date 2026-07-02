export type VaanForgeRuntimeDomain = {
  key: string;
  domain: string;
  apiOriginAllowed: boolean;
  adminOrigin: boolean;
  cookieAccessRequired: boolean;
};

export const vaanforgeRuntimeDomains: VaanForgeRuntimeDomain[] = [
  runtimeDomain("root", "vaanforge.com", true, false, false),
  runtimeDomain("www", "www.vaanforge.com", true, false, false),
  runtimeDomain("app", "app.vaanforge.com", true, false, true),
  runtimeDomain("auth", "auth.vaanforge.com", true, false, true),
  runtimeDomain("profile", "profile.vaanforge.com", true, false, true),
  runtimeDomain("settings", "settings.vaanforge.com", true, false, true),
  runtimeDomain("plans", "plans.vaanforge.com", true, false, false),
  runtimeDomain("support", "support.vaanforge.com", true, false, true),
  runtimeDomain("admin", "admin.vaanforge.com", true, true, true),
  runtimeDomain("docs", "docs.vaanforge.com", true, false, false),
  runtimeDomain("status", "status.vaanforge.com", true, false, false),
  runtimeDomain("developers", "developers.vaanforge.com", true, false, true),
  runtimeDomain("marketplace", "marketplace.vaanforge.com", true, false, false),
  runtimeDomain("api", "api.vaanforge.com", false, false, true),
  runtimeDomain("assets", "assets.vaanforge.com", false, false, false),
  runtimeDomain("cdn", "cdn.vaanforge.com", false, false, false),
  runtimeDomain("uploads", "uploads.vaanforge.com", false, false, true),
  runtimeDomain("files", "files.vaanforge.com", true, false, true),
  runtimeDomain("webhooks", "webhooks.vaanforge.com", false, false, false),
  runtimeDomain("events", "events.vaanforge.com", false, false, false),
  runtimeDomain("billing", "billing.vaanforge.com", true, false, true),
  runtimeDomain("checkout", "checkout.vaanforge.com", true, false, true),
  runtimeDomain("console", "console.vaanforge.com", true, true, true),
  runtimeDomain("factory", "factory.vaanforge.com", true, false, true),
  runtimeDomain("agents", "agents.vaanforge.com", true, false, true),
  runtimeDomain("deploy", "deploy.vaanforge.com", true, true, true),
  runtimeDomain("releases", "releases.vaanforge.com", true, false, true),
  runtimeDomain("legal", "legal.vaanforge.com", true, false, false),
  runtimeDomain("feedback", "feedback.vaanforge.com", true, false, true),
  runtimeDomain("learn", "learn.vaanforge.com", true, false, false),
  runtimeDomain("blog", "blog.vaanforge.com", true, false, false),
  runtimeDomain("partners", "partners.vaanforge.com", true, false, true),
  runtimeDomain("enterprise", "enterprise.vaanforge.com", true, false, false)
];

export function approvedVaanForgeOrigins() {
  return vaanforgeRuntimeDomains
    .filter((domain) => domain.apiOriginAllowed)
    .map((domain) => `https://${domain.domain}`);
}

export function adminVaanForgeOrigins() {
  return vaanforgeRuntimeDomains
    .filter((domain) => domain.adminOrigin)
    .map((domain) => `https://${domain.domain}`);
}

export function localDevelopmentOrigins(frontendUrl: string) {
  return Array.from(new Set([
    frontendUrl,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175"
  ]));
}

function runtimeDomain(key: string, domain: string, apiOriginAllowed: boolean, adminOrigin: boolean, cookieAccessRequired: boolean): VaanForgeRuntimeDomain {
  return { key, domain, apiOriginAllowed, adminOrigin, cookieAccessRequired };
}
