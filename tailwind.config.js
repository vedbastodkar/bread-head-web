/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── App palette (source of truth: iOS Trend tile) ──────────────
        brandGreen: '#4A5D4A', // CTAs, primary bars — never on dark bg
        accentGold:  '#D1A945', // ONLY: §5 Gamification + §8 Final CTA
        textTitle:   '#1A2E1A', // headlines + dark section backgrounds
        bgSage:      '#E6EDD9', // dominant page bg
        cardBg:      '#FFFFFF', // card surfaces
        softGold:    'rgba(209,169,69,0.13)',
        softGreen:   'rgba(74,93,74,0.10)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      // Ticker / marquee animation
      animation: {
        ticker: 'ticker 25s linear infinite',
      },
      keyframes: {
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
