import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsHealthPage() {
  return <AppShell><OperationsCommandCenter mode="health" /></AppShell>;
}
