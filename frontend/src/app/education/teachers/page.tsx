import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationTeachersPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Teachers"
      description="Teacher and staff workspace for assignments, classroom ownership, meetings, and institution operations."
      primaryRoute="/hr"
      product="Education staff operations"
      metrics={[
        { label: "Product", value: "VidyaLuma", detail: "Staff and classroom operations" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "HR link", value: "Active", detail: "Uses employee foundations" },
        { label: "Access", value: "RBAC", detail: "Role permission guarded" }
      ]}
      workflows={["Teacher profile setup", "Department assignment", "Meeting ownership", "Support escalation"]}
    />
  );
}
