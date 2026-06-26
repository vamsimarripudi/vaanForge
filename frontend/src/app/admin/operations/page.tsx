import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsPage() {
  return <AppShell><OperationsCommandCenter mode="summary" /></AppShell>;
}
