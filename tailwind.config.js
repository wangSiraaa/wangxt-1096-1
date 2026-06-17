/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          50: '#f5f0e8',
          100: '#ebe3d5',
          200: '#d4c9b5',
          300: '#b8a88e',
          400: '#9c876a',
          500: '#7a6b52',
          600: '#5a4f3d',
          700: '#3d3629',
          800: '#2a2520',
          900: '#1a1a2e',
          950: '#0f0f1a',
        },
        vermilion: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#e74c3c',
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
          800: '#7b241c',
          900: '#641e16',
        },
        dai: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#2c3e50',
          900: '#243b53',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
