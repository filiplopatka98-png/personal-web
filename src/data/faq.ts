export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Services-page FAQ. Answers are grounded in the real service packages
 * (src/content/services/*): web od 390 €, e-shop od 1 490 €, zrýchlenie od 390 €,
 * kontrola webu zadarmo (ceny podľa Google profilu, 30. 10. 2026). Rendered visibly by FaqSection.astro
 * and emitted as FAQPage structured data (AEO / People-also-ask).
 */
export const faqItems: Record<'sk' | 'en', FaqItem[]> = {
  sk: [
    {
      q: 'Koľko stojí web alebo e-shop?',
      a: 'Firemný web od 390 €, e-shop na WooCommerce od 1 490 €, zrýchlenie existujúceho webu od 390 € a údržba od 39 € mesačne. Kontrola webu je zadarmo, konzultácie 30 €/h. Presnú cenu poznáte vopred podľa rozsahu.',
    },
    {
      q: 'Ako dlho trvá vytvorenie webu?',
      a: 'Firemný web 2–4 týždne, e-shop 4–8 týždňov, zrýchlenie 1–2 týždne. Presný termín potvrdím pred začatím podľa rozsahu a pripravenosti podkladov.',
    },
    {
      q: 'Prečo vlastná WordPress téma a nie builder?',
      a: 'Weby staviam na vlastnej téme bez ťažkých builderov. Sú preto rýchlejšie, originálne a lepšie sa umiestňujú na Googli — a obsah si stále jednoducho spravujete sami vo WordPresse.',
    },
    {
      q: 'Postavíte aj e-shop na WooCommerce?',
      a: 'Áno. E-shop dostane platobnú bránu (GoPay, Stripe, Tatra banka), dopravu, napojenie na fakturáciu a podľa potreby aj na sklad či účtovníctvo (Pohoda, Money S3).',
    },
    {
      q: 'Zrýchlite alebo skontrolujete môj existujúci web?',
      a: 'Áno — kontrola webu je zadarmo: do 2 pracovných dní dostanete rýchlosť na mobile, SEO a 3 najdôležitejšie opravy. Samotné zrýchlenie robím za fixnú cenu od 390 € s výsledkom v číslach pred a po.',
    },
    {
      q: 'Poskytujete podporu po spustení?',
      a: 'Áno. Firemný web má 3 mesiace podpory, e-shop 6 mesiacov. Potom môžete pokračovať s údržbou od 39 € mesačne (e-shopy od 79 €), úpravy navyše 30 €/h.',
    },
  ],
  en: [
    {
      q: 'How much does a website or online store cost?',
      a: 'A company website starts at €390, a WooCommerce store at €1,490, speeding up an existing site at €390 and maintenance at €39/month. A website check is free, consulting €30/h. You know the exact price upfront.',
    },
    {
      q: 'How long does it take to build a website?',
      a: 'A company website takes 2–4 weeks, an online store 4–8 weeks, a speed-up 1–2 weeks. I confirm the exact timeline before we start.',
    },
    {
      q: 'Why a custom WordPress theme instead of a page builder?',
      a: 'I build on a custom theme without heavy page builders, so sites are faster, original and rank better on Google — while you still manage content easily in WordPress.',
    },
    {
      q: 'Do you build WooCommerce online stores?',
      a: 'Yes — with payment gateways (GoPay, Stripe, Tatra banka), shipping, invoicing integration and, if needed, stock or accounting sync (Pohoda, Money S3).',
    },
    {
      q: 'Can you speed up or review my existing website?',
      a: 'Yes — the website check is free: within 2 business days you get mobile speed, SEO and the 3 most important fixes. The speed-up itself is a fixed price from €390 with before/after numbers.',
    },
    {
      q: 'Do you provide support after launch?',
      a: 'Yes. A company website includes 3 months of support, an online store 6 months. After that, maintenance starts at €39/month (stores from €79), extra changes €30/h.',
    },
  ],
};
