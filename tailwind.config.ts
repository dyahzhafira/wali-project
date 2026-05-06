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
          50:  "#E7E9D8",  /* krem */
          100: "#A5C6DB",  /* biru muda */
          200: "#7db8d4",
          300: "#239DCA",  /* biru tua */
          400: "#1a8ab5",
          500: "#6DAF5F",  /* ijo muda */
          600: "#4d9640",
          700: "#03685E",  /* ijo tua — primary */
          800: "#024d45",
          900: "#01342f",
          950: "#011f1c",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
