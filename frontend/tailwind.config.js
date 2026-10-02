/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metro: {
          bg: "#080c14",
          surface: "#0f172a",
          panel: "#131c2e",
          border: "#1e293b",
          borderLight: "#334155",
          accent: "#2563eb",
          accentHover: "#1d4ed8",
          cyan: "#0ea5e9",
          muted: "#64748b",
          pass: "#10b981",
          fail: "#ef4444",
          amber: "#f59e0b"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Space Mono", "Courier New", "monospace"],
      },
      backgroundImage: {
        'technical-grid': "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
        'hairline-grid': "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
