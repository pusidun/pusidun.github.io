/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        p5: {
          red: '#E60012',
          'red-dark': '#A8000D',
          black: '#0A0A0A',
          white: '#F5F1E8',
          yellow: '#FFD400',
          cyan: '#19B5DC',
          gray: '#2A2A2A',
          'gray-light': '#4A4A4A',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', '思源黑体', 'sans-serif'],
        body: ['"Noto Sans SC"', '思源黑体', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slash-in': 'slashIn 500ms cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'shake': 'shake 200ms ease-in-out infinite',
        'pulse-fast': 'pulse 1s ease-in-out infinite',
      },
      keyframes: {
        slashIn: {
          '0%': { transform: 'translateX(-100%) skewX(-20deg)', opacity: '0' },
          '100%': { transform: 'translateX(0) skewX(-20deg)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translate(0, 0) skewX(-8deg)' },
          '25%': { transform: 'translate(-1px, 1px) skewX(-8deg)' },
          '50%': { transform: 'translate(1px, -1px) skewX(-8deg)' },
          '75%': { transform: 'translate(-1px, -1px) skewX(-8deg)' },
        },
      },
    },
  },
  plugins: [],
};
