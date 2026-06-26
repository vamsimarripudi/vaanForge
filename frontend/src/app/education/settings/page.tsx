import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationSettingsPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Education Settings"
      description="Suite-scoped preferences for institution billing, permissions, notifications, and audit visibility."
      primaryRoute="/settings"
      product="Suite settings"
      metrics={[
        { label: "Settings", value: "Shared", detail: "Uses settings API" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "Audit", value: "On", detail: "Sensitive changes logged" },
        { label: "Access", value: "Admin", detail: "Permission guarded" }
      ]}
      workflows={["Suite preferences", "Role checks", "Audit review", "Notification settings"]}
    />
  );
}
