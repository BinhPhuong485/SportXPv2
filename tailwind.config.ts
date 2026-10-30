import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'app-background': 'rgb(var(--color-bg) / <alpha-value>)',
        'app-surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'app-border': 'rgb(var(--color-border) / <alpha-value>)',
        'app-primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'app-accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'app-accent-text': 'rgb(var(--color-accent-text) / <alpha-value>)',
        'app-mint': 'rgb(var(--color-mint) / <alpha-value>)',
        'app-text': 'rgb(var(--color-text) / <alpha-value>)',
        'app-muted': 'rgb(var(--color-muted) / <alpha-value>)',
        'app-loss': 'rgb(var(--color-loss) / <alpha-value>)',
        'app-streak': 'rgb(var(--color-streak) / <alpha-value>)',
        'app-gold': 'rgb(var(--color-gold) / <alpha-value>)',
        'app-on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        'app-court-dark': 'rgb(var(--color-court-dark) / <alpha-value>)',
        'app-event-hosting': 'rgb(var(--color-event-hosting) / <alpha-value>)',
        'app-event-joined': 'rgb(var(--color-event-joined) / <alpha-value>)',
        'app-event-waitlist': 'rgb(var(--color-event-waitlist) / <alpha-value>)',
        'app-event-tournament': 'rgb(var(--color-event-tournament) / <alpha-value>)',
        'app-event-cancelled': 'rgb(var(--color-event-cancelled) / <alpha-value>)',
        'app-strava': '#FC5200',
        'app-cyan': '#00B4D8',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-accent)) 100%)',
        'bento-highlight': 'linear-gradient(135deg, rgb(var(--color-mint)) 0%, rgb(var(--color-surface)) 65%)',
      },
      borderRadius: {
        'bento': '20px',
        'btn': '14px',
        'input': '14px',
        'badge': '6px',
      },
      maxWidth: {
        'content': '720px',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
