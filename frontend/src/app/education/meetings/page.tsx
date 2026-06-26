import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationMeetingsPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Meetings"
      description="VaanMeet-powered classes, parent meetings, staff meetings, and institution session reporting."
      primaryRoute="/interviews"
      product="VaanMeet"
      metrics={[
        { label: "Product", value: "VaanMeet", detail: "Meeting entitlement" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "Provider", value: "Gated", detail: "Launch adapter placeholder" },
        { label: "Reports", value: "Suite", detail: "Separated education reports" }
      ]}
      workflows={["Class meeting scheduling", "Parent meeting links", "Staff reviews", "Meeting usage reports"]}
    />
  );
}
