/**
 * Build schema.org ItemList JSON-LD for a listing page (blog index, work
 * index). Strengthens entity structure and helps answer engines enumerate the
 * collection. `items` are already in display order.
 */
export function buildItemList(
  items: Array<{ url: string; name: string }>,
  name: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: it.url,
      name: it.name,
    })),
  };
}
