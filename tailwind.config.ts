import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        system: {
          bg: "#070913",
          panel: "#0d1224",
          border: "#1e294b",
          neon: "#38bdf8",
          purple: "#a855f7",
          gold: "#facc15",
          crimson: "#f43f5e",
          emerald: "#10b981",
        },
      },
      boxShadow: {
        "system-glow": "0 0 25px -5px rgba(56, 189, 248, 0.35), inset 0 0 15px -8px rgba(56, 189, 248, 0.25)",
        "purple-glow": "0 0 25px -5px rgba(168, 85, 247, 0.4), inset 0 0 15px -8px rgba(168, 85, 247, 0.25)",
        "crimson-glow": "0 0 25px -5px rgba(244, 63, 94, 0.4), inset 0 0 15px -8px rgba(244, 63, 94, 0.25)",
        "gold-glow": "0 0 25px -5px rgba(250, 204, 21, 0.4), inset 0 0 15px -8px rgba(250, 204, 21, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
