import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function ContactPage() {
  return (
    <PublicInfoPage
      title="Contact"
      description="Contact and support touchpoints for founders, customers, partners, creators, institutions, and event businesses."
      sections={[
        { title: "Sales", detail: "Use onboarding to select the right suite, plan, products, support level, and workspace setup." },
        { title: "Support", detail: "Customers can raise support tickets through the support and customer portal workflows after workspace activation." },
        { title: "Partners", detail: "Partners and creators can use dedicated collaboration workflows for campaigns, approvals, revenue share, and communication." }
      ]}
    />
  );
}
