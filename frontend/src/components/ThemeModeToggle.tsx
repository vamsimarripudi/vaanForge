"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

export function ThemeModeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, [mode]);

  return (
    <select
      aria-label="Theme mode"
      className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
      value={mode}
      onChange={(event) => setMode(event.target.value as ThemeMode)}
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
