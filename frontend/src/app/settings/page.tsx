import { AppShell } from "@/layouts/AppShell";
import { AuditPanel } from "@/features/audit/components/AuditPanel";
import { FileUploadPanel } from "@/features/files/components/FileUploadPanel";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";
import { RoleSetupPanel } from "@/features/roles/components/RoleSetupPanel";
import { SettingsOsPanel } from "@/features/settings/components/SettingsOsPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Settings OS"
        description="Company profile, users, roles, permissions, themes, domains, billing, notifications, templates, security, and API key placeholders."
        endpoint="/settings/summary"
        metricLabels={[
          { key: "themeMode", label: "Theme", detail: "Light, dark, or system" },
          { key: "emailNotifications", label: "Email", detail: "Email notification status" },
          { key: "smsNotifications", label: "SMS", detail: "SMS notification status" },
          { key: "apiKeysConfigured", label: "API keys", detail: "Provider config status" },
          { key: "billingEmail", label: "Billing", detail: "Billing contact" },
          { key: "state", label: "State", detail: "Settings API status" }
        ]}
        workflow={{
          title: "Admin settings",
          endpoint: "/settings",
          method: "PATCH",
          submitLabel: "Save Settings",
          successMessage: "Settings updated.",
          fields: [
            {
              name: "themeMode",
              label: "Theme mode",
              type: "select",
              defaultValue: "system",
              options: [
                { label: "System", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" }
              ]
            },
            {
              name: "billingEmail",
              label: "Billing email",
              placeholder: "billing@company.com",
              defaultValue: "billing@vmnexus.local",
              optional: true
            },
            {
              name: "notificationEmail",
              label: "Email notifications",
              type: "checkbox",
              defaultValue: true
            },
            {
              name: "notificationSms",
              label: "SMS notifications",
              type: "checkbox",
              defaultValue: false
            }
          ]
        }}
      />
      <SettingsOsPanel />
      <RoleSetupPanel />
      <AuditPanel />
      <FileUploadPanel />
    </AppShell>
  );
}
