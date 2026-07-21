import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { visibleArticles } from '../../../../content/launch';
import { buildOgSvg, renderOgPng } from '../../../../utils/ogImage';

// Prerender one OG PNG per visible article, per language.
export async function getStaticPaths() {
  const all = await getCollection('articles');
  return visibleArticles(all).map((entry) => {
    const [lang, ...rest] = entry.id.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry, lang } };
  });
}

export const GET: APIRoute = ({ props }) => {
  const { entry, lang } = props as { entry: { data: { title: string } }; lang: string };
  const svg = buildOgSvg({
    eyebrow: lang === 'sk' ? 'BLOG · FILIP LOPATKA' : 'BLOG · FILIP LOPATKA',
    title: entry.data.title,
    footer: 'Web developer · WordPress · Next.js · SK',
  });
  return new Response(renderOgPng(svg), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
