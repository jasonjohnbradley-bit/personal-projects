import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ghibli: {
          forest: '#2d5016',
          'forest-light': '#4a7c23',
          sky: '#87CEEB',
          'sky-light': '#b8e0f3',
          sunset: '#ff6b35',
          cream: '#fff8e7',
          rose: '#ffb6c1',
          teal: '#1e6b7f',
          fire: '#ff8c42',
          soot: '#2c2c2c',
          kodama: '#f5f5f0',
          grey: '#7a7a7a',
        },
      },
      fontFamily: {
        whimsical: ['"Comic Sans MS"', 'Chalkboard', 'cursive'],
        body: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        ghibli: '15px',
      },
      boxShadow: {
        'ghibli-soft': '0 4px 15px rgba(45, 80, 22, 0.1)',
        'ghibli-hover': '0 8px 25px rgba(45, 80, 22, 0.18)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'sparkle-fade': 'sparkleFade 0.8s ease-out forwards',
        land: 'land 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-15px, 15px)' },
        },
        sparkleFade: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.5)' },
        },
        land: {
          '0%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
