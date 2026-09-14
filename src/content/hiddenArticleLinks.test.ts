import { describe, it, expect } from 'vitest';
import { articleIdFromHref, unwrapHiddenArticleLinks, type HastNode } from './hiddenArticleLinks';

const text = (value: string): HastNode => ({ type: 'text', value });
const link = (href: string, label: string): HastNode => ({
  type: 'element',
  tagName: 'a',
  properties: { href },
  children: [text(label)],
});
const paragraph = (...children: HastNode[]): HastNode => ({
  type: 'root',
  children: [{ type: 'element', tagName: 'p', properties: {}, children }],
});

describe('articleIdFromHref', () => {
  it('maps SK and EN article links to collection ids', () => {
    expect(articleIdFromHref('/blog/wp-cli-12-prikazov/')).toBe('sk/wp-cli-12-prikazov');
    expect(articleIdFromHref('/en/blog/wp-cli-12-prikazov/')).toBe('en/wp-cli-12-prikazov');
  });
  it('accepts a missing trailing slash and a hash', () => {
    expect(articleIdFromHref('/blog/redis-object-cache-wordpress#ttl')).toBe('sk/redis-object-cache-wordpress');
  });
  it('ignores the blog index, other pages and external links', () => {
    expect(articleIdFromHref('/blog/')).toBeNull();
    expect(articleIdFromHref('/en/blog/')).toBeNull();
    expect(articleIdFromHref('/sluzby/')).toBeNull();
    expect(articleIdFromHref('https://example.com/blog/x/')).toBeNull();
  });
});

describe('unwrapHiddenArticleLinks', () => {
  const visible = (id: string) => id === 'sk/verejny';

  it('unwraps a link to a hidden article and keeps its text', () => {
    const tree = paragraph(text('Súvisiace: '), link('/blog/skryty/', 'Skrytý článok'), text(' · '), link('/blog/verejny/', 'Verejný'));
    unwrapHiddenArticleLinks(tree, visible);
    expect(tree.children![0]!.children).toEqual([
      text('Súvisiace: '),
      text('Skrytý článok'),
      text(' · '),
      link('/blog/verejny/', 'Verejný'),
    ]);
  });

  it('leaves external and non-article links alone', () => {
    const tree = paragraph(link('https://developer.woocommerce.com/', 'docs'), link('/sluzby/', 'služby'));
    const before = JSON.stringify(tree);
    unwrapHiddenArticleLinks(tree, visible);
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('handles links nested deeper in the tree (lists, emphasis)', () => {
    const tree: HastNode = {
      type: 'root',
      children: [{
        type: 'element', tagName: 'ul', properties: {}, children: [{
          type: 'element', tagName: 'li', properties: {}, children: [{
            type: 'element', tagName: 'strong', properties: {}, children: [link('/en/blog/skryty/', 'Hidden')],
          }],
        }],
      }],
    };
    unwrapHiddenArticleLinks(tree, visible);
    expect(JSON.stringify(tree)).not.toContain('"tagName":"a"');
    expect(JSON.stringify(tree)).toContain('"value":"Hidden"');
  });
});
