import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shell: "#020617",
        panel: "rgba(15, 23, 42, 0.72)",
        cyan: "#06b6d4",
        rose: "#f43f5e",
        emerald: "#10b981",
        amber: "#f59e0b",
      },
      fontFamily: {
        sans: ["Space Grotesk", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 80px rgba(6, 182, 212, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
