import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function AgentSecurityPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="adminSecurity" /></AppShell>;
}
