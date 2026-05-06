/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-ink': 'var(--color-accent-ink)',
        'accent-hover': 'var(--color-accent-hover)',
      },
      fontFamily: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      maxWidth: {
        content: 'var(--content-max)',
        prose: 'var(--content-prose)',
        narrow: 'var(--content-narrow)',
        mid: 'var(--content-mid)',
        wide: 'var(--content-wide)',
        extra: 'var(--content-extra)',
      },
    },
  },
  plugins: [],
};
