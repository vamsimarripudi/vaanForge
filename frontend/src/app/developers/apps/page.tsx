import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperAppsPage() {
  return <AppShell><DeveloperPlatform mode="apps" /></AppShell>;
}
