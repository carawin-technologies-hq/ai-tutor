import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        oxford: { DEFAULT: "#002147", 50: "#EEF3FA", 100: "#DCE7F5", 200: "#B7CBE6", 300: "#8AA9D0", 400: "#4F77A8", 500: "#1D4A80", 600: "#0B3566", 700: "#002B5B", 800: "#002147", 900: "#00152E" },
        crimson: { DEFAULT: "#DC143C", 50: "#FEF1F3", 100: "#FDE0E5", 500: "#DC143C", 600: "#BF1033", 700: "#9E0D2B" },
        sun: { DEFAULT: "#FFC20E", 50: "#FFF9E5", 100: "#FFF0B8", 500: "#FFC20E", 600: "#E0A800" },
        ink: "#0B1B33",
        mist: "#F4F7FB",
        line: "#E3E8EF",
        success: { DEFAULT: "#16A34A", 50: "#ECFDF3", 100: "#D1FADF", 700: "#15803D" },
        warn: { DEFAULT: "#D97706", 50: "#FFFAEB", 100: "#FEF0C7", 700: "#B45309" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,33,71,0.04), 0 4px 16px rgba(0,33,71,0.06)",
        lift: "0 8px 30px rgba(0,33,71,0.12)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        pulseRing: { "0%": { transform: "scale(1)", opacity: "0.6" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
        wave: { "0%,100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        pulseRing: "pulseRing 1.6s ease-out infinite",
        wave: "wave 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
