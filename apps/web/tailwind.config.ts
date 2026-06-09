import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F1FB', 100: '#B5D4F4', 500: '#1A6EFF',
          700: '#185FA5', 900: '#0D1B3E',
        },
      },
    },
  },
  plugins: [],
};

export default config;
