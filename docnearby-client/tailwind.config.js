/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        'blue-popsicle': '#0f2862',
        'redline': '#9e363a',
        'purple-shadow': '#091f36',
        'grey-blue-leaf': '#4f5f76',
      },
    },
  },
  plugins: [],
}

