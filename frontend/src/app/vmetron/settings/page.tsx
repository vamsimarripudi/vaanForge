import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronSettingsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="VMetron Settings"
      description="Suite-scoped preferences for event billing, permissions, notifications, and audit visibility."
      primaryRoute="/settings"
      product="Suite settings"
      metrics={[
        { label: "Settings", value: "Shared", detail: "Uses settings API" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Audit", value: "On", detail: "Sensitive changes logged" },
        { label: "Access", value: "Admin", detail: "Permission guarded" }
      ]}
      workflows={["Suite preferences", "Role checks", "Audit review", "Notification settings"]}
    />
  );
}
