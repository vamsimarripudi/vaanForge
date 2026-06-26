import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function BuilderWorkspaceSettingsPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="workspace" /></AppShell>;
}
