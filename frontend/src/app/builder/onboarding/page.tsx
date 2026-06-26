import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function BuilderOnboardingPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="onboarding" /></AppShell>;
}
