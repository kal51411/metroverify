/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metro: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          muted: "#64748b",
          accent: "#2563eb",
          accentLight: "#3b82f6",
          emerald: "#10b981",
          rose: "#ef4444",
          amber: "#f59e0b"
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
}
