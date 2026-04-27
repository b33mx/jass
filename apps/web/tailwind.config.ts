import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brandRed: '#db2121',
        brandYellow: '#fada3d'
      }
    }
  },
  plugins: []
} satisfies Config;
