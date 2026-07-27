// Hand-ported from the web app's src/index.css @theme block (Tailwind v4
// alpha, CSS-first config — NativeWind's current stable targets Tailwind v3
// and can't read that file directly). Every color class used across the app
// (indigo-600, violet-600, slate-*, etc.) is Tailwind's stock palette, so
// only the custom font tokens need porting here.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // These MUST match the exact keys passed to useFonts() in app/_layout.tsx.
      // expo-font registers each weight under its own family name, so "Inter"
      // or "Space Grotesk" resolve to nothing and silently fall back to the
      // system serif — which is exactly what happened before this was fixed.
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
        display: ["SpaceGrotesk_700Bold"],
        mono: ["JetBrainsMono_400Regular"]
      }
    }
  },
  plugins: []
};
