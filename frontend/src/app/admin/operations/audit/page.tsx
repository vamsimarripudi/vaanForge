import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsAuditPage() {
  return <AppShell><OperationsCommandCenter mode="audit" /></AppShell>;
}
