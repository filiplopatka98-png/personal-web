/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      maxWidth: {
        content: '1320px',
        prose: '720px',
        narrow: '720px',
        wide: '880px',
        extra: '1100px',
      },
    },
  },
  plugins: [],
};
