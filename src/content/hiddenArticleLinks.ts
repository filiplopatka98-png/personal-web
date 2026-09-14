import { isArticleVisible } from './launch';

/**
 * Rehype plugin pre telá článkov: odkaz na článok, ktorý launch allowlist
 * skrýva (stránka sa negeneruje → 404), sa vyrenderuje ako obyčajný text.
 * Keď článok pridáš do `ARTICLE_ALLOWLIST`, odkaz sa pri ďalšom builde vráti
 * sám — v markdowne ostáva nezmenený.
 *
 * Monitorix SEO crawl (2026-09-14) našiel 14 takých 404 odkazov × 2 jazyky.
 */

// Minimálny tvar HAST uzla — bez závislosti na @types/hast (je len tranzitívna).
export interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

const ARTICLE_HREF = /^\/(?:(en)\/)?blog\/([^/?#]+)\/?(?:[?#].*)?$/;

/** Id článku (`sk/slug` / `en/slug`) pre interný odkaz na článok, inak null. */
export function articleIdFromHref(href: string): string | null {
  const m = ARTICLE_HREF.exec(href);
  return m ? `${m[1] ?? 'sk'}/${m[2]}` : null;
}

/** Nahradí `<a>` na skrytý článok jeho obsahom (text odkazu ostane). */
export function unwrapHiddenArticleLinks(tree: HastNode, isVisible: (id: string) => boolean = isArticleVisible): void {
  const walk = (node: HastNode): void => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      walk(child);
      if (child.type === 'element' && child.tagName === 'a') {
        const id = articleIdFromHref(String(child.properties?.href ?? ''));
        if (id && !isVisible(id)) return child.children ?? [];
      }
      return [child];
    });
  };
  walk(tree);
}

export default function rehypeHiddenArticleLinks() {
  return (tree: HastNode) => unwrapHiddenArticleLinks(tree);
}
