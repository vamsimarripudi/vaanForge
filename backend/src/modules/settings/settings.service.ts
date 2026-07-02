import type { SettingsInput } from "@kravia/shared/growth";
import { settingsRepository, type SettingsRepository } from "./settings.repository";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository = settingsRepository) {}

  async get(organizationId: string) {
    return this.repository.get(organizationId);
  }

  async update(input: SettingsInput) {
    return this.repository.update(input);
  }

  async summary(organizationId: string) {
    const settings = await this.get(organizationId);
    return {
      themeMode: settings.themeMode,
      emailNotifications: settings.notificationEmail,
      smsNotifications: settings.notificationSms,
      apiKeysConfigured: settings.apiKeysConfigured,
      billingEmail: settings.billingEmail || "not configured"
    };
  }

  async operatingSystem(organizationId: string) {
    const settings = await this.get(organizationId);

    return {
      companyProfile: {
        organizationId,
        status: "workspace-managed",
        route: "/api/v1/workspaces"
      },
      users: {
        status: "role-scoped",
        route: "/api/v1/auth/session",
        note: "User access is derived from authenticated sessions and workspace roles."
      },
      roles: {
        status: "configured",
        route: "/api/v1/roles"
      },
      permissions: {
        status: "checkable",
        route: "/api/v1/roles/check"
      },
      themes: {
        themeMode: settings.themeMode,
        options: ["light", "dark", "system"]
      },
      domains: {
        status: "launch-configured",
        keys: ["ROOT_DOMAIN", "FRONTEND_URL", "API_URL"]
      },
      billing: {
        billingEmail: settings.billingEmail || "not configured",
        route: "/api/v1/billing/summary"
      },
      notifications: {
        email: settings.notificationEmail,
        sms: settings.notificationSms,
        route: "/api/v1/notifications"
      },
      templates: [
        { name: "Email templates", route: "/api/v1/communication/operating-system" },
        { name: "SMS templates", route: "/api/v1/communication/operating-system" },
        { name: "Report templates", route: "/api/v1/reports/operating-system" }
      ],
      security: {
        status: "contract-checked",
        controls: ["auth middleware", "permission guards", "CSRF", "audit logs", "secure cookies"]
      },
      apiKeysPlaceholder: {
        configured: settings.apiKeysConfigured,
        status: settings.apiKeysConfigured ? "configured" : "placeholder",
        providerGroups: ["email", "sms", "storage", "ai", "payments", "realtime"]
      }
    };
  }

  health() {
    return this.repository.health();
  }
}

export const settingsService = new SettingsService();
