/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        success: {
          50: '#E8F5E9',
          500: '#43A047',
          600: '#388E3C',
        },
        warning: {
          50: '#FFF3E0',
          500: '#FB8C00',
          600: '#F57C00',
        },
        danger: {
          50: '#FFEBEE',
          500: '#E53935',
          600: '#D32F2F',
        },
        info: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          500: '#00BCD4',
          600: '#00ACC1',
          700: '#0097A7',
        },
        neutral: {
          50: '#F5F7FA',
          100: '#ECEFF4',
          200: '#E0E6ED',
          300: '#C0CCDA',
          400: '#90A4AE',
          500: '#546E7A',
          600: '#455A64',
          700: '#37474F',
          800: '#263238',
          900: '#1A237E',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
