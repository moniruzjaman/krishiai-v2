import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        bn: ['Hind Siliguri', 'Noto Serif Bengali', 'sans-serif'],
      },
      colors: {
        green: {
          950: '#052e16',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
