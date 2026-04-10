/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        royal: '#0056A6',
        cometa: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          hover: '#F1F5F9',
          accent: '#0056A6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
