import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function BuilderTeamSettingsPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="team" /></AppShell>;
}
