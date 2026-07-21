import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://lopatka.sk',
  base: '/',
  trailingSlash: 'always',

  // Markdown/MDX article bodies: every external (absolute-URL) link gets
  // rel="nofollow noopener noreferrer". Internal links are relative (/blog/…)
  // so they're left untouched. Keeps citation/source links from passing link
  // equity and hardens them (noopener/noreferrer). MDX inherits this config.
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { rel: ['nofollow', 'noopener', 'noreferrer'] }],
    ],
  },

  build: {
    format: 'directory',
    // Inline ALL CSS into HTML head — eliminates render-blocking external CSS
    // requests on first paint. Trade-off: bigger HTML (~10-30KB extra per page)
    // but fewer round-trips. Net positive for Lighthouse Performance score on
    // a static site with small CSS payload. Per Lighthouse: saves ~630ms on
    // mobile FCP. Default is 'auto' (only inlines stylesheets <4KB).
    inlineStylesheets: 'always',
  },

  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Tailwind v4 is a Vite plugin now (the @astrojs/tailwind integration was
  // dropped in Astro 6+). Theme config lives in tailwind.config.mjs, loaded via
  // `@config` in src/styles/global.css.
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    mdx(),
    // Exclude 404 pages from the sitemap (they carry a page-level noindex).
    // i18n emits <xhtml:link rel="alternate" hreflang> in the sitemap for pages
    // that share a path across locales (home, /blog/<slug> ↔ /en/blog/<slug>).
    // Translated static routes with different slugs (/praca/ vs /en/work/) don't
    // auto-pair here — those still rely on the reciprocal hreflang in <head>.
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      i18n: {
        defaultLocale: 'sk',
        locales: { sk: 'sk-SK', en: 'en-US' },
      },
    }),
  ],
});