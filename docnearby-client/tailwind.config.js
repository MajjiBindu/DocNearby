/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6CBD",
          dark: "#0B5AA3",
          light: "#E8F1FB",
        },

        secondary: {
          DEFAULT: "#2563EB",
        },

        medical: {
          primary: "#0F6CBD",
          secondary: "#2563EB",
          accent: "#E8F1FB",
          grey: "#F5F7FA",

          text: {
            DEFAULT: "#1F2937",
            light: "#6B7280",
          },

          border: "#E5E7EB",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
          white: "#FFFFFF",
        },
      },

      boxShadow: {
        medical: "0 2px 10px rgba(15, 108, 189, 0.08)",
        "medical-hover": "0 10px 30px rgba(15, 108, 189, 0.15)",
        card: "0 1px 6px rgba(0,0,0,0.06)",
      },

      borderRadius: {
        medical: "16px",
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },

  plugins: [],
}