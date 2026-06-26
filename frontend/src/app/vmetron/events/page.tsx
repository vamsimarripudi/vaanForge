import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronEventsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="Events"
      description="Event operating workspace for organizers, communities, businesses, registrations, support, and reporting."
      primaryRoute="/vmetron/dashboard"
      product="VMetron"
      metrics={[
        { label: "Product", value: "VMetron", detail: "Event core product" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Events", value: "0", detail: "Ready for event setup" },
        { label: "Access", value: "RBAC", detail: "Role permission guarded" }
      ]}
      workflows={["Event setup", "Session planning", "Organizer assignment", "Event reports"]}
    />
  );
}
