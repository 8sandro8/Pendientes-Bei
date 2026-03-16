/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#f5f0eb',
        accent: '#d4a574',
        cream: '#f5f0eb',
        error: '#c45c5c',
        success: '#5c9c6c',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
