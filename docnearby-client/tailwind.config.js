/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#e0f2f1',
          DEFAULT: '#00a2a1', // Apollo-style Teal
          dark: '#00796b',
        },
        secondary: {
          light: '#e8eaf6',
          DEFAULT: '#102039', // Professional Navy
          dark: '#050c1a',
        },
        accent: {
          DEFAULT: '#ff6f61', // Coral for CTAs
        },
        medical: {
          blue: '#1070ff',
          grey: '#f0f4f8',
          text: '#2d3748',
          'text-light': '#718096',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'medical': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'medical-hover': '0 10px 30px rgba(0, 162, 161, 0.1)',
      },
    },
  },
  plugins: [],
}

