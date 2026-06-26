import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsSettingsPage() {
  return <AppShell><OperationsCommandCenter mode="settings" /></AppShell>;
}
