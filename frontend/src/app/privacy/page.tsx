import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      title="Privacy"
      description="Privacy placeholder for account, workspace, customer, support, billing, file, and audit data handled by the ecosystem."
      sections={[
        { title: "Data scope", detail: "The system stores organization, workspace, user, role, customer, finance, task, support, legal, compliance, report, and audit records." },
        { title: "Access", detail: "Role permissions, signed sessions, CSRF controls, and audit logs protect sensitive operational actions." },
        { title: "Production review", detail: "A qualified legal and security review is required before using this text for real customers." }
      ]}
    />
  );
}
