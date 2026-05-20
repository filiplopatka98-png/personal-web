/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        accent: 'var(--accent)',
        /* Legacy keys — all resolve to dark surface / coral accent.
           Removed in Phase 6 cleanup once no Tailwind class still references them. */
        bg: 'var(--bg-solid)',
        bg2: 'var(--bg-solid)',
        accent2: 'var(--accent)',
        accent3: 'var(--accent)',
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
