import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronFormsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="Forms"
      description="VFormix forms for event applications, feedback, sponsorship intake, and campaign workflows."
      primaryRoute="/reports"
      product="VFormix"
      metrics={[
        { label: "Product", value: "VFormix", detail: "Form entitlement" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Submissions", value: "0", detail: "Ready for form data" },
        { label: "Exports", value: "CSV", detail: "Report export compatible" }
      ]}
      workflows={["Event applications", "Sponsor intake", "Feedback forms", "Submission reports"]}
    />
  );
}
