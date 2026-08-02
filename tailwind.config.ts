import type { Config } from "tailwindcss";

/**
 * Positivus design system, ported to the app UI.
 *
 * Radii and the offset "hard" shadow come from the Positivus landing page (see
 * src/components/PositivusLanding.tsx): a near-black ink, a single bright
 * accent, a grey surface, and flat 1px ink borders in place of soft shadows.
 * The accent is the one place the app departs from that reference — gold
 * instead of the original lime.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191A23",
        accent: { DEFAULT: "#FCCF45", dark: "#EDBE2E" },
        mist: "#F3F3F3",
        muted: "#898989",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // 45px is the landing page's card radius; 30px keeps the same language
        // on the denser app panels, 14px is its control radius.
        card: "45px",
        panel: "30px",
        control: "14px",
      },
      boxShadow: {
        hard: "0 5px 0 0 #191A23",
        "hard-sm": "0 3px 0 0 #191A23",
      },
    },
  },
  plugins: [],
};

export default config;
