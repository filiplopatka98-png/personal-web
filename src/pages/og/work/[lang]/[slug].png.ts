import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildOgSvg, renderOgPng } from '../../../../utils/ogImage';

// Prerender one OG PNG per project, per language.
export async function getStaticPaths() {
  const all = await getCollection('projects');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry, lang } };
  });
}

export const GET: APIRoute = ({ props }) => {
  const { entry, lang } = props as { entry: { data: { name: string; kind: string } }; lang: string };
  const svg = buildOgSvg({
    eyebrow: lang === 'sk' ? 'PRÁCA · FILIP LOPATKA' : 'WORK · FILIP LOPATKA',
    title: entry.data.name,
    footer: entry.data.kind,
  });
  return new Response(renderOgPng(svg), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
