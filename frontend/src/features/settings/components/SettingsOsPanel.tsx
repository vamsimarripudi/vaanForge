"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type SettingsOs = {
  companyProfile: { organizationId: string; status: string; route: string };
  users: { status: string; route: string; note: string };
  roles: { status: string; route: string };
  permissions: { status: string; route: string };
  themes: { themeMode: string; options: string[] };
  domains: { status: string; keys: string[] };
  billing: { billingEmail: string; route: string };
  notifications: { email: boolean; sms: boolean; route: string };
  templates: Array<{ name: string; route: string }>;
  security: { status: string; controls: string[] };
  apiKeysPlaceholder: { configured: boolean; status: string; providerGroups: string[] };
};

const fallbackSettingsOs: SettingsOs = {
  companyProfile: { organizationId: "local", status: "workspace-managed", route: "/api/v1/workspaces" },
  users: { status: "role-scoped", route: "/api/v1/auth/session", note: "User access is derived from authenticated sessions and workspace roles." },
  roles: { status: "configured", route: "/api/v1/roles" },
  permissions: { status: "checkable", route: "/api/v1/roles/check" },
  themes: { themeMode: "system", options: ["light", "dark", "system"] },
  domains: { status: "launch-configured", keys: ["ROOT_DOMAIN", "FRONTEND_URL", "API_URL"] },
  billing: { billingEmail: "not configured", route: "/api/v1/billing/summary" },
  notifications: { email: false, sms: false, route: "/api/v1/notifications" },
  templates: [
    { name: "Email templates", route: "/api/v1/communication/operating-system" },
    { name: "SMS templates", route: "/api/v1/communication/operating-system" },
    { name: "Report templates", route: "/api/v1/reports/operating-system" }
  ],
  security: { status: "contract-checked", controls: ["auth middleware", "permission guards", "CSRF", "audit logs", "secure cookies"] },
  apiKeysPlaceholder: { configured: false, status: "placeholder", providerGroups: ["email", "sms", "storage", "ai", "payments", "realtime"] }
};

function DetailCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
            <span className="text-ink-muted">{label}</span>
            <strong className="text-right">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SettingsOsPanel() {
  const [settingsOs, setSettingsOs] = useState<SettingsOs>(fallbackSettingsOs);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshSettingsOs() {
    setState("loading");
    try {
      const nextSettingsOs = await apiClient<SettingsOs>("/settings/operating-system");
      setSettingsOs(nextSettingsOs);
      setState("success");
    } catch {
      setSettingsOs(fallbackSettingsOs);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshSettingsOs();
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Settings OS</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Company profile, users, roles, permissions, themes, domains, billing, notifications, templates, security, and API keys placeholder.
          </p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshSettingsOs}>
          Refresh settings OS
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <DetailCard title="Company Profile" rows={[["Status", settingsOs.companyProfile.status], ["Route", settingsOs.companyProfile.route], ["Organization", settingsOs.companyProfile.organizationId]]} />
        <DetailCard title="Users" rows={[["Status", settingsOs.users.status], ["Route", settingsOs.users.route], ["Note", settingsOs.users.note]]} />
        <DetailCard title="Roles" rows={[["Status", settingsOs.roles.status], ["Route", settingsOs.roles.route]]} />
        <DetailCard title="Permissions" rows={[["Status", settingsOs.permissions.status], ["Route", settingsOs.permissions.route]]} />
        <DetailCard title="Themes" rows={[["Mode", settingsOs.themes.themeMode], ["Options", settingsOs.themes.options.join(", ")]]} />
        <DetailCard title="Domains" rows={[["Status", settingsOs.domains.status], ["Keys", settingsOs.domains.keys.join(", ") || "not configured"]]} />
        <DetailCard title="Billing" rows={[["Email", settingsOs.billing.billingEmail], ["Route", settingsOs.billing.route]]} />
        <DetailCard title="Notifications" rows={[["Email", String(settingsOs.notifications.email)], ["SMS", String(settingsOs.notifications.sms)], ["Route", settingsOs.notifications.route]]} />
        <DetailCard title="Templates" rows={settingsOs.templates.map((template) => [template.name, template.route])} />
        <DetailCard title="Security" rows={[["Status", settingsOs.security.status], ["Controls", settingsOs.security.controls.join(", ")]]} />
        <DetailCard title="API Keys Placeholder" rows={[["Configured", String(settingsOs.apiKeysPlaceholder.configured)], ["Status", settingsOs.apiKeysPlaceholder.status], ["Providers", settingsOs.apiKeysPlaceholder.providerGroups.join(", ")]]} />
      </div>

      <div className="mt-6">
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Settings operating system" detail="Settings OS records are available." />
      </div>
    </section>
  );
}
