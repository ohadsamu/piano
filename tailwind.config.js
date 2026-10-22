/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ebony: {
          void: '#090B0F',
          lacquer: '#0D0F14',
          spruce: '#161922',
          iron: '#1E2230',
        },
        brass: {
          DEFAULT: '#E5A93C',
          light: '#F3C66F',
          dark: '#B88222',
        },
        parchment: {
          DEFAULT: '#FAF6EE',
          warm: '#F2ECE1',
        },
        felt: {
          crimson: '#9F1239',
        },
      },
    },
  },
  plugins: [],
};
