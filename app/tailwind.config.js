// Hand-ported from the web app's src/index.css @theme block (Tailwind v4
// alpha, CSS-first config — NativeWind's current stable targets Tailwind v3
// and can't read that file directly). Every color class used across the app
// (indigo-600, violet-600, slate-*, etc.) is Tailwind's stock palette, so
// only the custom font tokens need porting here.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter"],
        display: ["Space Grotesk"],
        mono: ["JetBrains Mono"]
      }
    }
  },
  plugins: []
};
