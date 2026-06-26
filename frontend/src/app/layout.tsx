import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "VM Nexus Ecosystem OS",
  description: "One operating ecosystem for Education Suite and VMetron Suite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
