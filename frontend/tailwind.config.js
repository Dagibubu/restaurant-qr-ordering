/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  'rgb(253 251 247 / <alpha-value>)',
          100: 'rgb(249 244 234 / <alpha-value>)',
          200: 'rgb(242 232 213 / <alpha-value>)',
        },
        terracotta: {
          50:  'rgb(253 243 238 / <alpha-value>)',
          100: 'rgb(251 228 213 / <alpha-value>)',
          300: 'rgb(232 168 130 / <alpha-value>)',
          500: 'rgb(201 107 63 / <alpha-value>)',
          600: 'rgb(178 87 48 / <alpha-value>)',
          700: 'rgb(143 69 38 / <alpha-value>)',
        },
        sage: {
          50:  'rgb(243 246 241 / <alpha-value>)',
          100: 'rgb(227 235 222 / <alpha-value>)',
          500: 'rgb(107 142 107 / <alpha-value>)',
          600: 'rgb(84 114 84 / <alpha-value>)',
          700: 'rgb(61 84 61 / <alpha-value>)',
        },
        gold: {
          400: 'rgb(212 169 90 / <alpha-value>)',
          500: 'rgb(193 147 64 / <alpha-value>)',
        },
        ink: {
          900: 'rgb(31 26 20 / <alpha-value>)',
          700: 'rgb(58 50 40 / <alpha-value>)',
          500: 'rgb(107 97 85 / <alpha-value>)',
          400: 'rgb(138 128 115 / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(31,26,20,0.08), 0 4px 16px -4px rgba(31,26,20,0.06)',
        card: '0 4px 20px -6px rgba(31,26,20,0.10)',
        lift: '0 10px 32px -12px rgba(31,26,20,0.18)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};