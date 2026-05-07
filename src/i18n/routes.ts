import type { Lang } from './index';

/**
 * Static top-level routes after Claude Design redesign.
 * - /praca + /en/work — projects (was /projekty)
 * - /sluzby + /en/services — services (unchanged)
 * - /blog + /en/blog — blog (unchanged)
 * - /ponuka + /en/brief — brief wizard (NEW)
 *
 * About is no longer a standalone page — it's a section on home.
 * Contact is no longer a standalone page — it's the footer.
 */
export const staticRoutes = {
  work:     { sk: '/praca/',   en: '/en/work/'     },
  services: { sk: '/sluzby/',  en: '/en/services/' },
  blog:     { sk: '/blog/',    en: '/en/blog/'     },
  brief:    { sk: '/ponuka/',  en: '/en/brief/'    },
} as const;

export type StaticRouteKey = keyof typeof staticRoutes;

export function getStaticRoute(key: StaticRouteKey, lang: Lang): string {
  return staticRoutes[key][lang];
}

export function getAltUrl(currentPath: string, currentLang: Lang): string | null {
  if (currentPath === '/' && currentLang === 'sk') return '/en/';
  if (currentPath === '/en/' && currentLang === 'en') return '/';

  for (const paths of Object.values(staticRoutes)) {
    if (currentLang === 'sk' && paths.sk === currentPath) return paths.en;
    if (currentLang === 'en' && paths.en === currentPath) return paths.sk;
  }
  return null;
}
