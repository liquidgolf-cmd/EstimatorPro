/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f5f0eb',
        surface: '#ffffff',
        border: '#e8e0d8',
        'border-mid': '#d9d0c5',
        accent: '#e07b39',
        'accent-dark': '#c96b2e',
        'text-primary': '#1e1a16',
        'text-mid': '#3d3228',
        'text-muted': '#8a7968',
        'text-faint': '#b5a99a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

