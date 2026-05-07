import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://filiplopatka98-png.github.io',
  base: '/personal-web/',
  trailingSlash: 'always',

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

  integrations: [tailwind({ applyBaseStyles: false }), mdx(), sitemap()],
});