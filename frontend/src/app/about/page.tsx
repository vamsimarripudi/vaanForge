import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function AboutPage() {
  return (
    <PublicInfoPage
      title="About VM Nexus"
      description="VM nexus Pvt Ltd is building a calm, premium operating ecosystem for founders, institutions, creators, teams, clients, and customers."
      sections={[
        { title: "Mission", detail: "Guide a business from idea to onboarding, plan selection, operations, finance, hiring, sales, support, legal, compliance, reports, communication, and growth." },
        { title: "Suites", detail: "Education Suite supports schools, colleges, and institutes. VMetron Suite supports events, organizers, communities, creators, and businesses." },
        { title: "Architecture", detail: "The product is modular, permission-aware, audit-backed, and ready for durable production services once external launch configuration is supplied." }
      ]}
    />
  );
}
