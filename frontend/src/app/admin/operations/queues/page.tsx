import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsQueuesPage() {
  return <AppShell><OperationsCommandCenter mode="queues" /></AppShell>;
}
