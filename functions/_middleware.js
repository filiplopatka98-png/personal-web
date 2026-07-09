/**
 * Cloudflare Pages middleware — keep preview/staging hostnames out of search
 * indexes.
 *
 * Only *.pages.dev responses get `X-Robots-Tag: noindex, nofollow`. The
 * production custom domain (lopatka.sk) is left untouched and stays fully
 * indexable — the host check guarantees the two never mix, unlike a static
 * `_headers` rule which cannot tell the hostnames apart.
 *
 * Runs on Cloudflare Pages only. GitHub Pages and the Astro build both ignore
 * this directory, so it has no effect on the current live site.
 */
export async function onRequest(context) {
  const response = await context.next();
  const host = new URL(context.request.url).hostname;
  if (host.endsWith('.pages.dev')) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
}
