import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function FeaturesPage() {
  return (
    <PublicInfoPage
      title="Features"
      description="A connected operating ecosystem for onboarding, billing, operations, finance, HR, sales, support, legal, compliance, reports, communication, automation, and intelligence."
      sections={[
        { title: "Founder control", detail: "Company health, revenue, expenses, profit, cash flow, tasks, approvals, support, sales, hiring, compliance, and alerts." },
        { title: "Operating modules", detail: "Finance, CRM, support, HR, legal, compliance, creators, partners, communication, automation, settings, documents, and reports." },
        { title: "Suite products", detail: "Education Suite and VMetron Suite sell cleanly while sharing billing, support, account, reports, settings, and admin foundations." }
      ]}
    />
  );
}
