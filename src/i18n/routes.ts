import type { Lang } from './index';

/**
 * Static top-level routes. Dynamic detail routes (project/post by slug) are
 * resolved separately via the content collection's slugKey field.
 */
export const staticRoutes = {
  about:    { sk: '/o-mne/',    en: '/en/about/'    },
  services: { sk: '/sluzby/',   en: '/en/services/' },
  projects: { sk: '/projekty/', en: '/en/projects/' },
  blog:     { sk: '/blog/',     en: '/en/blog/'     },
  contact:  { sk: '/kontakt/',  en: '/en/contact/'  },
} as const;

export type StaticRouteKey = keyof typeof staticRoutes;

/**
 * Returns the path for a given top-level route in a given language.
 */
export function getStaticRoute(key: StaticRouteKey, lang: Lang): string {
  return staticRoutes[key][lang];
}

/**
 * Given the current path + current lang, returns the equivalent path in
 * the OTHER language, or null if no mapping exists (e.g. a 404 page,
 * or a dynamic page that hasn't been indexed yet).
 *
 * For dynamic pages (project/post detail), callers should compute altUrl
 * from the entry's slugKey instead — this helper handles the static set.
 */
export function getAltUrl(currentPath: string, currentLang: Lang): string | null {
  // Home pages
  if (currentPath === '/' && currentLang === 'sk') return '/en/';
  if (currentPath === '/en/' && currentLang === 'en') return '/';

  // Static routes
  for (const paths of Object.values(staticRoutes)) {
    if (currentLang === 'sk' && paths.sk === currentPath) return paths.en;
    if (currentLang === 'en' && paths.en === currentPath) return paths.sk;
  }

  return null;
}
