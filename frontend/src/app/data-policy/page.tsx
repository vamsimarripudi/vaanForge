import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function DataPolicyPage() {
  return (
    <PublicInfoPage
      title="Data Policy"
      description="Data-policy placeholder for storage, retention, uploads, documents, audit logs, report exports, and provider integrations."
      sections={[
        { title: "Storage", detail: "Local development storage is abstracted from the production S3-compatible storage provider." },
        { title: "Retention", detail: "Operational records, report exports, uploaded documents, and audit logs should follow the final production retention policy." },
        { title: "Provider readiness", detail: "Email, SMS, realtime, AI, payments, storage, and durable database providers remain launch-gated until production credentials are configured." }
      ]}
    />
  );
}
