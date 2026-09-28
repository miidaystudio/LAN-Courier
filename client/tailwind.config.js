/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          50: '#18181B',
          100: '#141416',
          200: '#111113',
          300: '#0D0D0E',
          400: '#080809',
          500: '#050505',
        }
      },
      boxShadow: {
        'bento': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'bento-hover': '0 16px 48px rgba(0, 0, 0, 0.7)',
        'glow-white': '0 0 25px rgba(255, 255, 255, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
