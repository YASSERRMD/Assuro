/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          dark: '#0F1B33',
          50: '#f0f4ff',
          100: '#e0e8ff',
          600: '#1B2A4A',
          900: '#0F1B33',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#F2DFA0',
          dark: '#A07C2A',
        },
        light: { DEFAULT: '#F7F8FA' },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}
