/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'infraeye-primary': '#8ff5ff',
        'infraeye-surface': '#0d0e0f',
        'infraeye-grid': '#06B6D4',
        'infraeye-accent': '#f9f2f9',
        'infraeye-secondary': '#757576',
        'infraeye-danger': '#ff7162',
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
      },
      backdropFilter: {
        'blur-20': 'blur(20px)',
        'blur-24': 'blur(24px)',
      },
    },
  },
  plugins: [],
};
