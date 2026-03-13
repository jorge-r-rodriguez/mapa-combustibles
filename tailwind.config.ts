import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#eef3f5",
        surface: "#f8fbfc",
        primary: {
          DEFAULT: "#0b63f6",
          dark: "#084dc1"
        },
        accent: {
          DEFAULT: "#1bb66a",
          dark: "#13854d"
        },
        ink: "#101828",
        muted: "#667085",
        stroke: "rgba(16, 24, 40, 0.08)"
      },
      boxShadow: {
        panel: "0 16px 48px rgba(8, 19, 49, 0.08)",
        glow: "0 18px 65px rgba(11, 99, 246, 0.18)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(11, 99, 246, 0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(27, 182, 106, 0.12), transparent 34%)"
      }
    }
  },
  plugins: []
};

export default config;
