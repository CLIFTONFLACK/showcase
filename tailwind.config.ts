import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#008080",
          900: "#004D4D",
          700: "#008080",
          500: "#78BFBF",
          300: "#AEDBDB",
          100: "#DEF4F4",
          50: "#F4FFFF",
        },
        ink: "#0B2B2B",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,128,128,0.25)",
      },
      backgroundImage: {
        "hero-grad":
          "radial-gradient(1200px 600px at 80% -10%, #AEDBDB 0%, rgba(174,219,219,0) 60%), linear-gradient(180deg, #F4FFFF 0%, #DEF4F4 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
