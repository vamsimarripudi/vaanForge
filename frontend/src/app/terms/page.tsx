import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function TermsPage() {
  return (
    <PublicInfoPage
      title="Terms"
      description="Operational terms placeholder for VM Nexus Ecosystem OS until final legal documents are reviewed by qualified counsel."
      sections={[
        { title: "Use of service", detail: "Access is controlled by account, organization, suite, active plan, product entitlement, usage limits, and role permissions." },
        { title: "Customer duties", detail: "Customers are responsible for accurate workspace data, lawful usage, final approvals, and production credential configuration." },
        { title: "Review status", detail: "This public legal page is a product placeholder and must be reviewed before production launch." }
      ]}
    />
  );
}
