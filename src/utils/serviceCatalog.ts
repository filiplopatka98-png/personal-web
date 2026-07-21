import type { Service } from '../content/schemas';

/**
 * Parse a "from" price string ("600 €+", "1k €+", "2 000 €+") into a number of
 * euros, or null when it can't be parsed cleanly. Used to emit Offer prices in
 * the services OfferCatalog (AEO: answer engines quote package pricing).
 * Strips regular, non-breaking and thin spaces before matching digits.
 */
export function parseStartingPrice(price: string): number | null {
  const cleaned = price.toLowerCase().replace(/[\s  ]/g, '');
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)(k)?/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(',', '.'));
  if (Number.isNaN(n)) return null;
  return match[2] === 'k' ? Math.round(n * 1000) : Math.round(n);
}

interface CatalogOpts {
  /** Localized catalog name. */
  name: string;
  /** @id of the Organization that provides the services. */
  orgId: string;
  /** BCP-47 locale, e.g. 'sk-SK'. */
  inLanguage: string;
}

/**
 * Build schema.org OfferCatalog JSON-LD from the service collection data.
 * Each package becomes an Offer wrapping a Service; a parseable "from" price is
 * emitted as a minPrice PriceSpecification (EUR).
 */
export function buildServiceCatalog(services: Service[], opts: CatalogOpts): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: opts.name,
    inLanguage: opts.inLanguage,
    provider: { '@id': opts.orgId },
    itemListElement: services.map((s) => {
      const price = parseStartingPrice(s.price);
      return {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          description: s.tagline,
          serviceType: s.name,
          provider: { '@id': opts.orgId },
        },
        ...(price !== null && {
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: price,
            priceCurrency: 'EUR',
          },
        }),
      };
    }),
  };
}
