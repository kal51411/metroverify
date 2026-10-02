/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#0a0a0a",
        charcoal: "#111111",
        onyx: "#1a1a1a",
        iron: "#2a2a2a",
        steel: "#3d3d3d",
        ash: "#666666",
        silver: "#999999",
        fog: "#cccccc",
        ivory: "#f0ede8",
        warm: "#f8f5f0",
        amber: {
          DEFAULT: "#d97706",
          light: "#fbbf24",
          deep: "#92400e",
          glow: "rgba(217,119,6,0.15)",
        },
        pass: "#16a34a",
        fail: "#dc2626",
        passBg: "rgba(22,163,74,0.12)",
        failBg: "rgba(220,38,38,0.12)",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "number-tick": "numberTick 0.3s ease-out forwards",
        "line-draw": "lineDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "needle": "needle 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        lineDraw: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        needle: {
          "0%": { transform: "rotate(-90deg)" },
          "100%": { transform: "rotate(var(--needle-angle))" },
        },
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        "hairline": "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "amber-radial": "radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 70%)",
      },
      backgroundSize: {
        "hairline": "80px 80px",
      },
    },
  },
  plugins: [],
};
