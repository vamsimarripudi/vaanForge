import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsAnalyticsPage() {
  return <AppShell><OperationsCommandCenter mode="analytics" /></AppShell>;
}
