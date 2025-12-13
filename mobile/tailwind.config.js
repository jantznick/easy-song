/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme (default) - use with dark: variants for dark mode
        primary: '#6366F1',
        'primary-hover': '#818CF8',
        secondary: '#10B981',
        accent: '#F59E0B',
        // These will be overridden with dark: classes
        background: '#FAFBFC', // Soft off-white
        'background-secondary': '#F4F6F8',
        surface: '#FFFFFF', // Pure white for cards
        'surface-hover': '#F8FAFC',
        border: '#E4E7EB', // Softer, warmer border
        'text-primary': '#1A1F2E', // Darker, richer black
        'text-secondary': '#4B5563', // Medium gray
        'text-muted': '#9CA3AF', // Lighter gray
      },
    },
  },
  plugins: [],
}
