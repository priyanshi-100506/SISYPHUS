import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Load fonts via next/font so CSS variables are injected automatically.
// This is both more reliable and eliminates the FOUT from raw <link> tags.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SISYPHUS — AI Agent Reliability",
  description:
    "See where your AI agent gets stuck. Send tool calls to SISYPHUS and get instant loop, retry, and bloat analysis.",
  openGraph: {
    title: "SISYPHUS — AI Agent Reliability",
    description: "See where your AI agent gets stuck.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
