import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",

        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          deep: "var(--accent-deep)",
          bg: "var(--accent-bg)",
        },
        stuck: {
          DEFAULT: "var(--stuck)",
          fill: "var(--stuck-fill)",
          deep: "var(--stuck-deep)",
          bg: "var(--stuck-bg)",
        },
        ok: {
          DEFAULT: "var(--ok)",
          bg: "var(--ok-bg)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          bg: "var(--warn-bg)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          bg: "var(--danger-bg)",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "Menlo", "monospace"],
        tabular: ["var(--font-geist-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "14px",
        chip: "999px",
        tile: "10px",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 2.5s ease-in-out infinite",
        "fade-in": "fade-in 0.18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
