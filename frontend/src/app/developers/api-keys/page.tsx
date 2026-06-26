import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperApiKeysPage() {
  return <AppShell><DeveloperPlatform mode="apiKeys" /></AppShell>;
}
