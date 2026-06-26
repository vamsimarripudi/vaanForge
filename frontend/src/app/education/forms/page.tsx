import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationFormsPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Forms"
      description="VFormix forms for admissions, feedback, approvals, surveys, and internal institution workflows."
      primaryRoute="/reports"
      product="VFormix"
      metrics={[
        { label: "Product", value: "VFormix", detail: "Form entitlement" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "Submissions", value: "0", detail: "Ready for form data" },
        { label: "Exports", value: "CSV", detail: "Report export compatible" }
      ]}
      workflows={["Admission forms", "Feedback collection", "Approval forms", "Submission reports"]}
    />
  );
}
