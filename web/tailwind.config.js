/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2A4A', dark: '#0F1B33' },
        gold: { DEFAULT: '#C5A55A' },
        light: { DEFAULT: '#F2F2F2' },
      },
    },
  },
  plugins: [],
}
