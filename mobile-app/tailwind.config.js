/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#03040d",
        card: "rgba(255,255,255,0.06)",
        sky: { 500: "#35a8ff" },
        emerald: { 400: "#2fe0a6", 500: "#10b981" },
      },
    },
  },
  plugins: [],
};
