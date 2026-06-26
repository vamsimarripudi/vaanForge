import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function EducationSupportPage() {
  return (
    <SuiteModulePage
      suiteName="Education Suite"
      title="Education Support"
      description="Institution support queue for students, parents, teachers, and administrators."
      primaryRoute="/support"
      product="Support"
      metrics={[
        { label: "Product", value: "Support", detail: "Shared support entitlement" },
        { label: "Suite", value: "Education", detail: "Requires EDUCATION_SUITE" },
        { label: "Queue", value: "Live", detail: "Uses support ticket API" },
        { label: "Realtime", value: "Gated", detail: "Provider placeholder until launch" }
      ]}
      workflows={["Student support tickets", "Parent support tickets", "Teacher escalation", "Support reports"]}
    />
  );
}
