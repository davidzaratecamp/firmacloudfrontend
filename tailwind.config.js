export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8', 900: '#1e3a5f' },
        accent: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        violet: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        surface: { 950: '#05070f', 900: '#0b1120', 800: '#111827', 700: '#1f2937', 600: '#334155' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(34, 211, 238, 0.55)',
        'glow-violet': '0 0 20px -5px rgba(139, 92, 246, 0.55)',
        'glow-lg': '0 0 40px -8px rgba(34, 211, 238, 0.45)',
      },
      backgroundImage: {
        aurora: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #22d3ee 100%)',
        'grid-glow': 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.25), transparent 60%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    }
  },
  plugins: [],
}
