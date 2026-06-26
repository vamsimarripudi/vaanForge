import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperSdkPage() {
  return <AppShell><DeveloperPlatform mode="sdk" /></AppShell>;
}
