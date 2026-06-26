import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsAgentsPage() {
  return <AppShell><OperationsCommandCenter mode="agents" /></AppShell>;
}
