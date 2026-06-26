import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-background)",
        surface: "var(--color-surface)",
        muted: "var(--color-surface-muted)",
        ink: "var(--color-text)",
        "ink-muted": "var(--color-text-muted)",
        line: "var(--color-border)",
        brand: "var(--color-primary)",
        "brand-soft": "var(--color-primary-soft)",
        accent: "var(--color-accent)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        floating: "var(--shadow-floating)"
      },
      borderRadius: {
        panel: "8px"
      }
    }
  },
  plugins: []
};

export default config;
