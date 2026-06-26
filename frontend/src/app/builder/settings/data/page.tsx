import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function BuilderDataSettingsPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="data" /></AppShell>;
}
