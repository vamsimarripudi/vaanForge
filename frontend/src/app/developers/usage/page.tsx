import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperUsagePage() {
  return <AppShell><DeveloperPlatform mode="usage" /></AppShell>;
}
