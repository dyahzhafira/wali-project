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
        wali: {
          50:  "#e8f8f5",
          100: "#c8ede7",
          200: "#9ddcd0",
          300: "#6ac4b6",
          400: "#3dab9b",
          500: "#2a9e8e",
          600: "#228076",
          700: "#1b6560",
          800: "#174f4b",
          900: "#123c39",
          950: "#0a2422",
        },
        teal: {
          dark: "#1B5E5C",
          mid:  "#2A9E8E",
          light:"#E8F8F5",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
