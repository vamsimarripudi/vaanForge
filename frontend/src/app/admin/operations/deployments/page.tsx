import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsDeploymentsPage() {
  return <AppShell><OperationsCommandCenter mode="deployments" /></AppShell>;
}
