import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { display: ["Georgia", "serif"] },
      colors: { leaf: { 50: "#f2f8ef", 100: "#e1f0da", 600: "#287247", 700: "#1f623d", 900: "#173b2a" } },
    },
  },
  plugins: [],
} satisfies Config;
