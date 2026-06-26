import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function BuilderSecuritySettingsPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="security" /></AppShell>;
}
