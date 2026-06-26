import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronRegistrationsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="Registrations"
      description="Registration collection and tracking for attendees, sponsors, creators, and business event participants."
      primaryRoute="/registrations"
      product="VMetron registrations"
      metrics={[
        { label: "Product", value: "VMetron", detail: "Registration workflow" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Records", value: "0", detail: "Ready for registration data" },
        { label: "Reports", value: "Suite", detail: "Separated VMetron reports" }
      ]}
      workflows={["Attendee registration", "Sponsor registration", "Status tracking", "Registration reports"]}
    />
  );
}
