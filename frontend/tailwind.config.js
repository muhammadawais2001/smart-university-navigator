/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2f9', 100: '#d9e2f1', 500: '#2b4a7e', 600: '#1e3a68', 700: '#16305a', 800: '#0f2447', 900: '#0a1a36', 950: '#060f21' },
        teal: { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
