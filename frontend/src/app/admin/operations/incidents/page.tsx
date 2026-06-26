import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsIncidentsPage() {
  return <AppShell><OperationsCommandCenter mode="incidents" /></AppShell>;
}
