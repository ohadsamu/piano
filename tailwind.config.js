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
      },
      fontSize: {
        // 1.25 type scale, 16px base. Nothing below 13px.
        'xs-13': ['0.8125rem', { lineHeight: '1.25rem' }],
        'md-20': ['1.25rem', { lineHeight: '1.75rem' }],
        'lg-25': ['1.5625rem', { lineHeight: '2rem' }],
        'xl-31': ['1.9375rem', { lineHeight: '2.375rem' }],
        'note-44': ['2.75rem', { lineHeight: '1' }],
      },
      borderRadius: {
        control: '6px',
        panel: '12px',
      },
      boxShadow: {
        sheet: '0 -12px 40px rgba(0, 0, 0, 0.55)',
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
          deep: '#881337',
        },
        ink: {
          primary: '#F5F2EB',
          secondary: '#B8B2A6',
          muted: '#7D8494',
        },
        hand: {
          right: '#38BDF8',
          left: '#818CF8',
        },
        state: {
          ok: '#10B981',
          hint: '#F59E0B',
          wrong: '#F43F5E',
        },
      },
    },
  },
  plugins: [],
};
