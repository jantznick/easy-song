/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        'primary-hover': '#818CF8',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#0F172A',
        'background-secondary': '#1E293B',
        surface: '#1E293B',
        'surface-hover': '#334155',
        border: '#334155',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
    },
  },
  plugins: [],
}
