---
slugKey: frontend
lang: sk
title: Moderný frontend
longTitle: Moderný frontend, ktorý sa cíti rýchly
icon: frontend
order: 2
priceFrom: "od 2500 €"
typicalTime: "4-8 týždňov"
ctaLabel: Mám záujem
included:
  - Astro, Next.js alebo React projekt podľa requirementov
  - Tailwind CSS + design tokens nastavenie
  - Responsive design (mobile-first)
  - Lighthouse 95+ ako východisko (perf / a11y / SEO)
  - TypeScript strict konfigurácia
  - GitHub Actions CI/CD pipeline
  - Hosting na Vercel / Netlify / Cloudflare Pages
notFor: "Ak chceš WordPress alebo si nie si istý či potrebuješ frontend framework — najprv si dohodneme call, často WordPress robí to isté lacnejšie a jednoduchšie."
---

Astro, Next.js alebo React projekty kde rýchlosť a SEO majú byť na 95+. Vhodné pre SaaS landing pages, content-heavy weby, marketing weby s blogom, e-shop fronty pred custom backendom, alebo jednoducho weby, kde záleží na detailoch.

Astro je moja prvá voľba pre statické content sites — generuje 0 JS by default, MDX pre obsah, výborná developer experience. Next.js používam keď treba SSR, server actions, alebo deep React ecosystem (auth providers, complex form handling). React (bez frameworku) iba ak ide o malý widget alebo embed do existujúceho webu.

Pracujem v TypeScript strict mode. Design tokens v CSS custom properties (žiadny CSS-in-JS), Tailwind ako utility layer, custom komponenty kde to dáva zmysel. Žiadne UI knižnice typu MUI/Chakra — tie hrajú proti tvojmu vlastnému design systému a robia bundle size 2× väčší.

Performance budget je východisko: LCP pod 1.5s, JS payload pod 30 KB gzipped na hero stránku, CLS pod 0.05. Lighthouse CI gate v GitHub Actions znemožní deploy keď sa scoreny zhoršia.
