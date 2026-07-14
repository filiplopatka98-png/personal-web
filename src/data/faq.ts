export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Services-page FAQ. Answers are grounded in the real service packages
 * (src/content/services/*): landing od 600 €, firemný web od 1 000 €,
 * eshop od 2 000 €, audit od 300 €. Rendered visibly by FaqSection.astro
 * and emitted as FAQPage structured data (AEO / People-also-ask).
 */
export const faqItems: Record<'sk' | 'en', FaqItem[]> = {
  sk: [
    {
      q: 'Koľko stojí web alebo eshop?',
      a: 'Landing page od 600 €, firemný web s CMS od 1 000 €, eshop (WooCommerce alebo headless) od 2 000 € a audit existujúceho webu od 300 €. Presnú cenu dostaneš po krátkom briefe podľa rozsahu projektu.',
    },
    {
      q: 'Ako dlho trvá vytvorenie webu?',
      a: 'Landing page 2–3 týždne, firemný web 4–6 týždňov a eshop 8–12 týždňov. Audit býva hotový do týždňa. Presný termín potvrdíme na úvodnom hovore podľa rozsahu a pripravenosti podkladov.',
    },
    {
      q: 'WordPress, alebo Next.js/headless — čo je pre mňa lepšie?',
      a: 'Závisí od projektu. WordPress je ideálny, keď si chceš obsah spravovať sám a rýchlo publikovať. Next.js alebo headless volím pri dôraze na maximálny výkon a custom funkcie. Poradím ti podľa cieľov, nie podľa módy.',
    },
    {
      q: 'Postavíš aj eshop na WooCommerce?',
      a: 'Áno. Robím WooCommerce aj headless eshopy s custom checkoutom, platobnými bránami (Stripe, GoPay, Tatra banka) a napojením na sklad či ERP (Pohoda, MoneyS3), s dôrazom na rýchlosť a konverziu.',
    },
    {
      q: 'Zrýchliš alebo posúdiš môj existujúci web?',
      a: 'Áno — audit od 300 € zahŕňa analýzu výkonu (Core Web Vitals), SEO, prístupnosti a UX, s prioritizovaným zoznamom opráv a hodinovým video callom. Samotná implementácia opráv je potom samostatný projekt.',
    },
    {
      q: 'Poskytuješ podporu po spustení?',
      a: 'Áno. Každý balíček obsahuje podporu — 1 mesiac pri landing page, 3 mesiace pri firemnom webe a 6 mesiacov pri eshope. Po jej skončení sa vieme dohodnúť na priebežnej údržbe.',
    },
  ],
  en: [
    {
      q: 'How much does a website or online store cost?',
      a: 'A landing page starts at €600, a company website with a CMS at €1,000, an online store (WooCommerce or headless) at €2,000, and an audit of an existing site at €300. You get an exact quote after a short brief, based on scope.',
    },
    {
      q: 'How long does it take to build a website?',
      a: 'A landing page takes 2–3 weeks, a company website 4–6 weeks, and an online store 8–12 weeks. An audit is usually done within a week. We confirm the exact timeline on a kickoff call based on scope and how ready your content is.',
    },
    {
      q: 'WordPress or Next.js/headless — which is right for me?',
      a: 'It depends on the project. WordPress is ideal when you want to manage content yourself and publish quickly. I choose Next.js or headless when maximum performance and custom features matter most. I advise based on your goals, not hype.',
    },
    {
      q: 'Do you build WooCommerce online stores?',
      a: 'Yes. I build both WooCommerce and headless stores with a custom checkout, payment gateways (Stripe, GoPay, Tatra banka) and stock/ERP integration (Pohoda, MoneyS3), focused on speed and conversion.',
    },
    {
      q: 'Can you speed up or review my existing website?',
      a: 'Yes — an audit from €300 covers performance (Core Web Vitals), SEO, accessibility and UX, with a prioritized fix list and a one-hour video call. Implementing the fixes is then a separate project.',
    },
    {
      q: 'Do you provide support after launch?',
      a: 'Yes. Every package includes support — 1 month for a landing page, 3 months for a company website and 6 months for an online store. After that, we can arrange ongoing maintenance.',
    },
  ],
};
