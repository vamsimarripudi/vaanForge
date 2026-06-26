import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronMeetingsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="Meetings"
      description="VaanMeet sessions for event planning, speaker coordination, business meetings, and community calls."
      primaryRoute="/interviews"
      product="VaanMeet"
      metrics={[
        { label: "Product", value: "VaanMeet", detail: "Meeting entitlement" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Provider", value: "Gated", detail: "Launch adapter placeholder" },
        { label: "Usage", value: "Limited", detail: "Plan controlled" }
      ]}
      workflows={["Organizer meetings", "Speaker calls", "Sponsor reviews", "Meeting usage reports"]}
    />
  );
}
