import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#000000',
          900: '#0a0a0a',
          800: '#1c1c1e',
          700: '#2c2c2e',
          600: '#3a3a3c',
          500: '#48484a',
          400: '#636366',
          300: '#8e8e93',
          200: '#aeaeb2',
          100: '#c7c7cc',
          50:  '#f2f2f7',
        },
        accent: {
          orange: '#ff9f0a',
          green:  '#30d158',
          red:    '#ff453a',
          blue:   '#0a84ff',
          purple: '#bf5af2',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'scan-line': 'scan-line 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 150ms ease-out',
      },
      keyframes: {
        'scan-line': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(180px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utils: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.pt-safe': { 'padding-top': 'env(safe-area-inset-top)' },
        '.pb-safe': { 'padding-bottom': 'env(safe-area-inset-bottom)' },
        '.pl-safe': { 'padding-left': 'env(safe-area-inset-left)' },
        '.pr-safe': { 'padding-right': 'env(safe-area-inset-right)' },
        '.mt-safe': { 'margin-top': 'env(safe-area-inset-top)' },
        '.mb-safe': { 'margin-bottom': 'env(safe-area-inset-bottom)' },
        '.h-screen-safe': { height: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' },
        '.touch-manip': { 'touch-action': 'manipulation' },
      });
    },
  ],
};

export default config;
