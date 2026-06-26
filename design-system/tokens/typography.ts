export const typography = {
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  scale: {
    display: { fontSize: "3rem", lineHeight: "1.05", fontWeight: 750 },
    h1: { fontSize: "2.25rem", lineHeight: "1.15", fontWeight: 720 },
    h2: { fontSize: "1.75rem", lineHeight: "1.2", fontWeight: 700 },
    h3: { fontSize: "1.25rem", lineHeight: "1.3", fontWeight: 680 },
    bodyLarge: { fontSize: "1.0625rem", lineHeight: "1.65", fontWeight: 450 },
    body: { fontSize: "0.9375rem", lineHeight: "1.6", fontWeight: 450 },
    small: { fontSize: "0.8125rem", lineHeight: "1.5", fontWeight: 500 },
    caption: { fontSize: "0.75rem", lineHeight: "1.4", fontWeight: 520 }
  }
} as const;
