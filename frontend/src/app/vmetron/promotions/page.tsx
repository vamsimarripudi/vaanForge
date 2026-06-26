import { SuiteModulePage } from "@/features/suites/components/SuiteModulePage";

export default function VMetronPromotionsPage() {
  return (
    <SuiteModulePage
      suiteName="VMetron Suite"
      title="Promotions"
      description="Promotion planning for events, communities, creator campaigns, partner offers, and communication workflows."
      primaryRoute="/communication"
      product="VMetron promotions"
      metrics={[
        { label: "Product", value: "VMetron", detail: "Promotion workflow" },
        { label: "Suite", value: "VMetron", detail: "Requires VMETRON_SUITE" },
        { label: "Channels", value: "Shared", detail: "Uses communication module" },
        { label: "Automation", value: "Ready", detail: "Can connect rule workflows" }
      ]}
      workflows={["Campaign planning", "Partner promotion", "Creator campaign link", "Communication reports"]}
    />
  );
}
