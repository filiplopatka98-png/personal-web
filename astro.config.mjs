import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

import cloudflare from "@astrojs/cloudflare";

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

  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    // Exclude 404 pages from the sitemap (they carry a page-level noindex).
    sitemap({ filter: (page) => !/\/404\/?$/.test(page) }),
  ],

  output: "hybrid",
  adapter: cloudflare()
});