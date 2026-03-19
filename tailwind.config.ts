import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-orange": "#ff6b35",
        "deep-obsidian": "#1a1a1a",
        "elegant-white": "#fafbfc",
        "text-muted": "#64748b",
        "key-bg": "#ffffff",
        "key-bg-dark": "#333333",
      },
      backgroundImage: {
        "orange-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
