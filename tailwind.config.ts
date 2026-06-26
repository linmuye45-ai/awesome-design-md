import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B2A4A",
        accent: "#E85D04",
        cream: "#FAFAF8",
        success: "#2E7D32",
        danger: "#C62828",
        warning: "#ED6C02",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(27,42,74,0.08), 0 1px 2px rgba(27,42,74,0.04)",
        cardHover: "0 4px 16px rgba(27,42,74,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
