import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DevelopersPage() {
  return <AppShell><DeveloperPlatform mode="dashboard" /></AppShell>;
}
