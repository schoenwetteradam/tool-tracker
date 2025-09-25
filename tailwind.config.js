/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spuncast: {
          navy: '#003865',
          navyDark: '#00274E',
          red: '#E41E2B',
          redDark: '#B0171F',
          sky: '#F3F6FB',
          slate: '#10263F',
        },
      },
      boxShadow: {
        brand: '0 20px 45px -24px rgba(0, 56, 101, 0.55)',
      },
    },
  },
  plugins: [],
}
