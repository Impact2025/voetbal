/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: '#00FF9D',
        'neon-dark': '#00cc7a',
        'neon-ink': '#009966',
        dark: {
          900: '#06060e',
          800: '#0a0a16',
          700: '#0f0f1e',
          600: '#141428',
          500: '#1a1a35',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px #00FF9D33' },
          to: { boxShadow: '0 0 40px #00FF9D66, 0 0 80px #00FF9D22' },
        },
      },
    },
  },
  plugins: [],
}
