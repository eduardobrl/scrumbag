import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18202f",
        panel: "#f7f8fb",
        line: "#d7dce5",
        accent: "#0f766e",
        risk: "#b42318",
        warn: "#a15c07"
      }
    }
  },
  plugins: []
};

export default config;
