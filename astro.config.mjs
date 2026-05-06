import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://filiplopatka98-png.github.io',
  base: '/personal-web/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
