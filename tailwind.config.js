/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jk: {
          bg:      '#06090A',
          card:    '#0C1610',
          border:  '#1A3320',
          green:   '#4ADE80',
          lime:    '#A3E635',
          gold:    '#FACC15',
          amber:   '#F59E0B',
          red:     '#F87171',
          crimson: '#EF4444',
          muted:   '#6B7280',
          dark:    '#030506',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body:    ['"Rajdhani"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green':  '0 0 12px #4ADE80, 0 0 30px rgba(74,222,128,0.3)',
        'glow-gold':   '0 0 12px #FACC15, 0 0 30px rgba(250,204,21,0.3)',
        'glow-red':    '0 0 12px #F87171, 0 0 30px rgba(248,113,113,0.3)',
        'glow-sm':     '0 0 6px #4ADE80',
      },
      animation: {
        'bounce-in':   'bounceIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275)',
        'shake':       'shake 0.4s ease-in-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'roll-in':     'rollIn 0.35s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.25s ease-out',
        'cancel-out':  'cancelOut 0.4s ease-in forwards',
        'float':       'float 3s ease-in-out infinite',
        'winner-glow': 'winnerGlow 1s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%':   { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '70%':  { transform: 'scale(1.15) rotate(3deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-6px)' },
          '40%':     { transform: 'translateX(6px)' },
          '60%':     { transform: 'translateX(-4px)' },
          '80%':     { transform: 'translateX(4px)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 6px #4ADE80' },
          '50%':     { boxShadow: '0 0 20px #4ADE80, 0 0 40px rgba(74,222,128,0.4)' },
        },
        rollIn: {
          '0%':   { transform: 'rotate(0deg) scale(0.3)', opacity: '0' },
          '60%':  { transform: 'rotate(300deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        cancelOut: {
          '0%':   { transform: 'scale(1)', opacity: '1', filter: 'brightness(2)' },
          '50%':  { transform: 'scale(1.3)', opacity: '0.5', filter: 'brightness(3) saturate(0)' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        winnerGlow: {
          '0%,100%': { textShadow: '0 0 10px #FACC15, 0 0 20px #FACC15' },
          '50%':     { textShadow: '0 0 30px #FACC15, 0 0 60px rgba(250,204,21,0.5)' },
        },
      },
    },
  },
  plugins: [],
}
