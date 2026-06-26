import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationStudentsPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Students"
      description="Student records, enrollment status, support visibility, and reporting signals for schools, colleges, and institutes."
      primaryRoute="/education/dashboard"
      product="VidyaLuma student management"
      metrics={[
        { label: "Product", value: "VidyaLuma", detail: "Education core product" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "Records", value: "0", detail: "Ready for student imports" },
        { label: "Access", value: "RBAC", detail: "Role permission guarded" }
      ]}
      workflows={["Student profile creation", "Enrollment status tracking", "Parent/support handoff", "Institution activity reports"]}
    />
  );
}
