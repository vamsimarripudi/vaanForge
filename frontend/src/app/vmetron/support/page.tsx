import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronSupportPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="VMetron Support"
      description="Event and community support queue for organizers, attendees, sponsors, and customers."
      primaryRoute="/support"
      product="Support"
      metrics={[
        { label: "Product", value: "Support", detail: "Shared support entitlement" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Queue", value: "Live", detail: "Uses support ticket API" },
        { label: "Realtime", value: "Gated", detail: "Provider placeholder until launch" }
      ]}
      workflows={["Attendee support", "Organizer support", "Sponsor escalation", "Support reports"]}
    />
  );
}
