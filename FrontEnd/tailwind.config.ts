import { Purple_Purse } from "next/font/google";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        BKprimary: "#1DA1F2",
        BKskyLight: "#dcf1f8ff",
        BKpurple: "#cfceff",
        BKPurpleLight: "#f1f0ff",
        BKyellow: "#FAE27C",
        BKyellowLight: "#fefce8",
        BKRed: "#970303ff",
        BKBlueChart:"#1DA1F2",
        BKYellowChart:"#FAE27C",
      },
    },
  },
  plugins: [],
};
export default config;
