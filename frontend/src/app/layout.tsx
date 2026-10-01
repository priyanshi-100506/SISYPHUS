import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SISYPHUS — AI Agent Reliability Platform",
  description: "See where your AI agent gets stuck.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
