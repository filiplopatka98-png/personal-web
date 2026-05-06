---
slugKey: frontend
lang: en
title: Modern frontend
longTitle: Modern frontend that feels fast
icon: frontend
order: 2
priceFrom: "from €2500"
typicalTime: "4-8 weeks"
ctaLabel: I'm interested
included:
  - Astro, Next.js, or React project per requirements
  - Tailwind CSS + design tokens setup
  - Responsive design (mobile-first)
  - Lighthouse 95+ as baseline (perf / a11y / SEO)
  - TypeScript strict configuration
  - GitHub Actions CI/CD pipeline
  - Hosting on Vercel / Netlify / Cloudflare Pages
notFor: "If you want WordPress, or you're not sure whether you need a frontend framework — let's hop on a call first. WordPress often does the same thing cheaper and simpler."
---

Astro, Next.js, or React projects where speed and SEO need to be 95+. Suited for SaaS landing pages, content-heavy sites, marketing sites with a blog, e-shop fronts on top of a custom backend, or simply sites where details matter.

Astro is my first pick for static content sites — generates 0 JS by default, MDX for content, excellent developer experience. I use Next.js when SSR is needed, server actions, or deep React ecosystem (auth providers, complex form handling). React (without a framework) only when it's a small widget or embed into an existing site.

I work in TypeScript strict mode. Design tokens in CSS custom properties (no CSS-in-JS), Tailwind as a utility layer, custom components where it makes sense. No UI libraries like MUI/Chakra — they fight against your own design system and double the bundle size.

Performance budget is the baseline: LCP under 1.5s, JS payload under 30 KB gzipped on the hero page, CLS under 0.05. A Lighthouse CI gate in GitHub Actions blocks deploys when scores regress.
