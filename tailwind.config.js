/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        forest: {
          50: '#f3f7f4',
          100: '#e1ede4',
          200: '#c4dbc9',
          300: '#9cc2a4',
          400: '#6ea37b',
          500: '#4a865b',
          600: '#386b47',
          700: '#2d5639',
          800: '#1a4d2e',
          900: '#0f3320',
          950: '#071d12',
        },
        mushroom: {
          50: '#fbf8f3',
          100: '#f5f0e6',
          200: '#eadfc8',
          300: '#ddc7a3',
          400: '#ccaa78',
          500: '#bf925b',
          600: '#b07d4d',
          700: '#936342',
          800: '#78513a',
          900: '#634432',
        },
        danger: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#ffcdc8',
          300: '#fea8a1',
          400: '#fb766b',
          500: '#f2493a',
          600: '#c81e1e',
          700: '#a91818',
          800: '#8b1819',
          900: '#741b1c',
        },
        warn: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e8a33d',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        moss: {
          400: '#c4a35a',
          500: '#8b5a2b',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'blink-red': 'blinkRed 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        blinkRed: {
          '0%, 100%': { backgroundColor: 'rgba(200, 30, 30, 0.15)', borderColor: '#c81e1e' },
          '50%': { backgroundColor: 'rgba(200, 30, 30, 0.4)', borderColor: '#f2493a' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(26, 77, 46, 0.12)',
        'danger-glow': '0 0 30px rgba(200, 30, 30, 0.4)',
      },
      backgroundImage: {
        'wood-grain': "repeating-linear-gradient(90deg, rgba(139,90,43,0.05) 0px, rgba(139,90,43,0.05) 2px, transparent 2px, transparent 8px)",
        'spore-dots': "radial-gradient(circle, rgba(196,163,90,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
