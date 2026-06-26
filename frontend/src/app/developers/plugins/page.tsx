import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperPluginsPage() {
  return <AppShell><DeveloperPlatform mode="plugins" /></AppShell>;
}
