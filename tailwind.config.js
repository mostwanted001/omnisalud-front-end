/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
          sans: ['Inter', 'sans-serif'],
      },
      colors: {
          primary: '#06b6d4',
          'primary-dark': '#0891b2',
          accent: '#3b82f6',
          'accent-dark': '#2563eb',
          dark: {
              900: '#0f172a',
              800: '#1e293b',
              700: '#334155',
              600: '#475569',
          }
      }
  }
  },
  plugins: [],
}

