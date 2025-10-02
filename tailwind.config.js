/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-theme'],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#f0fdfa',  // very light mint
          '100': '#ccfbf1',  // pale teal
          '200': '#99f6e4',  // light teal
          '300': '#2dd4bf',  // blue
          '400': '#14b8a6',  // bright teal
          '500': '#6366F10F',  // strong teal (base)
          '600': '#0d9488',  // darker teal
          '700': '#0f766e',  // deep teal
          '800': '#115e59',  // forest teal
          '900': '#134e4a',  // near-black teal
          '950': '#020303ff',  // darkest, almost black
        }
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} 