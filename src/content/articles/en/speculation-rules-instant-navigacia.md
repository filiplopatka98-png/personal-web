---
title: "The Speculation Rules API: near-instant navigation for small sites"
date: 2026-08-06
read: 7
tags: ["Performance"]
excerpt: "The browser can fetch and render your next page before you even click — no SPA, no framework needed. Here's a real Speculation Rules API config, where the risks are, and how to ship it on WordPress or a static site."
featured: false
faq:
  - q: "What does the Speculation Rules API do?"
    a: "The Speculation Rules API lets the browser prefetch or fully prerender a page the user is likely to click, before they actually click it. Rules are defined declaratively in a speculationrules JSON block or via an HTTP header, with no SPA or framework required. As a result, navigating to the next page can feel practically instant."
  - q: "What's the difference between prefetch and prerender?"
    a: "Prefetch only downloads the document into memory but renders nothing — it's the safer, cheaper option. Prerender goes further: it actually opens the page in a hidden background tab, runs its JavaScript, and fully renders it, so the browser just switches to the finished tab on click. Prerender delivers a bigger payoff but also carries more risk, since it runs someone else's page, side effects included, before the click happens."
  - q: "Do all browsers support Speculation Rules?"
    a: "No. Full support (prerender plus document rules with eagerness) landed in Chrome/Edge 109, with eagerness and where rules arriving later in Chrome/Edge 121. Firefox doesn't support it yet, and Safari has had it behind an experimental, off-by-default flag since version 26.2. Since browsers that don't recognize the API simply ignore it, it's a safe progressive enhancement that needs no fallback code."
  - q: "What are the risks of using the Speculation Rules API?"
    a: "There are three main risks: wasted speculations when a prerender never turns into a visit; analytics firing twice, since code hooked to the load event runs during the prerender itself; and JS side effects from custom code, like websockets or notification prompts, that need to be guarded with a document.prerendering check. The browser automatically defers so-called intrusive APIs like notifications or fullscreen until after activation, but custom code side effects are the developer's responsibility."
---

The Speculation Rules API solves this by letting the browser **fetch and render the next page before you even click the link** — via declarative JSON rules, no SPA or framework required — so the navigation itself feels like it takes zero milliseconds. The usual playbook for a "fast site" is: optimize images, cut TTFB, kill blocking JavaScript — all true, but it only fixes the first load. Every navigation after that — clicking a product, an article, the next page of a listing — waits on DNS, TCP, TLS, the request, and the render all over again.

This isn't a new idea — `<link rel="prefetch">` and the now-deprecated `<link rel="prerender">` have existed for years. What's different is that the Speculation Rules API does it properly: declarative JSON rules, control over how confident the browser needs to be before it "bets" on a link, and built-in guardrails against wasting battery and data ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

## Prefetch vs. prerender — not the same thing

The API supports two actions:

- **`prefetch`** downloads the document (and in some cases its subresources) into memory but renders nothing. It's the safer, cheaper option — a sensible first move on almost any site.
- **`prerender`** goes further: it actually opens the page in a hidden background tab, runs its JavaScript, and fully renders it. When you click, the browser just switches to the already-finished tab. The payoff is the biggest here, but so is the risk — you've run someone else's page, side effects included, before the user actually arrived at it ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

The Chrome team's own recommendation is to start with `prefetch`, confirm it doesn't break anything, and only then move some rules to the more aggressive `prerender` ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). If you're also chasing [LCP over 2.5 seconds](/en/blog/lcp-nad-2-5s-pricin/), this is one of the rare techniques that doesn't just lower the second page's LCP — it effectively zeroes it out, because the page is already done rendering by the time the click happens.

## A real config: document rules + eagerness

Instead of hardcoding specific URLs (which only makes sense for a handful of key pages), most projects benefit from **document rules** — a pattern that applies to every matching link, with exceptions carved out:

```html
<script type="speculationrules">
{
  "prefetch": [
    {
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/cart/*" } },
          { "not": { "href_matches": "/logout" } },
          { "not": { "selector_matches": ".no-prefetch" } }
        ]
      },
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "where": {
        "and": [
          { "selector_matches": ".prerender" },
          { "not": { "href_matches": "/cart/*" } }
        ]
      },
      "eagerness": "eager"
    }
  ]
}
</script>
```

`href_matches` uses URL Pattern API syntax, `selector_matches` runs against CSS selectors, and `and`/`not` combine into arbitrarily complex conditions ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). In this example every link except the cart and logout gets prefetched cautiously, and links carrying a `.prerender` class — typically your main CTAs like "next product" or "continue reading" — get prerendered more aggressively.

### Eagerness — how confident the browser has to be

Eagerness controls how sure the browser needs to be that you'll click a link before it fires:

- **`immediate`** — fires as soon as the browser sees the rule. This is the default for URL lists (`urls: [...]`).
- **`eager`** — on desktop, **10ms** of hovering over the link is enough; on mobile, it fires **50ms** after the link enters the viewport.
- **`moderate`** — on desktop, **200ms** of hover or an earlier `pointerdown`; on mobile, a heuristic around 500ms after scrolling stops. This is the default for document rules.
- **`conservative`** — fires only on `pointerdown`/`touchstart`, i.e. right before the click itself. Lowest risk, lowest payoff.

(Exact figures and defaults confirmed at [developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages).) Chrome also caps how many speculations can run at once — `immediate` allows up to 50 prefetches / 10 prerenders, while every other eagerness level is capped at 2 concurrent speculations (FIFO, older ones get evicted for newer ones) — so it can't flood a site with dozens of pointless requests.

## The risks worth planning for

Prerendering isn't free. Three things you have to police yourself:

1. **Waste.** Not every prerender turns into a visit. Sticking to a more conservative eagerness and excluding volatile pages (cart, checkout, logout) keeps the waste within reason.
2. **Analytics firing twice.** If your own analytics code hooks into the `load` event, it fires during the prerender — before anyone has actually seen the page. Major analytics and ad platforms already account for speculation rules and won't log a view until the page is activated, but custom code is on you ([developer.chrome.com/docs/web-platform/implementing-speculation-rules](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules)). Handle it with `document.prerendering` and the `prerenderingchange` event:

```js
function sendPageView() {
  // your analytics/GTM code
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', sendPageView, { once: true });
} else {
  sendPageView();
}
```

3. **JS side effects.** A script that requests notifications, opens fullscreen, or fires an `alert()` on load shouldn't be a problem on a prerendered page — the browser automatically defers these "intrusive" APIs until activation, and cancels the prerender outright if deferral isn't possible ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)). Still, it's good practice to guard any code with outward-facing side effects (websockets, third parties) behind a `document.prerendering` check — see also [how third-party scripts hit performance](/en/blog/third-party-skripty-vykon/), since it's usually foreign scripts that have no idea they're running in a prerendered context.

## Cross-origin limitations

The API is deliberately conservative about other domains:

- **Prefetch** across origins works, but for privacy reasons only when you have no cookies set for the destination domain.
- **Prerender** is same-origin by default. Cross-origin, same-site prerendering (e.g. from `www.yoursite.com` to `shop.yoursite.com`) is possible, but the target page has to opt in with a `Supports-Loading-Mode: credentialed-prerender` header ([developer.mozilla.org/.../Supports-Loading-Mode](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Supports-Loading-Mode)). Cross-site prerendering (a genuinely different domain) isn't possible at all right now.

For a typical single-domain store or blog, that means in practice: you're only writing rules for your own, internal links — which is exactly the case where speculative loading pays off the most.

## How to actually ship it

**Static site (e.g. Astro):** just add a `<script type="speculationrules">` block to your layout — either static or generated based on the page structure. If you'd rather keep the ruleset out of the HTML (say, for CDN reasons), it can also be delivered via the `Speculation-Rules` HTTP header instead of an inline script, which helps when something other than your own server generates the HTML ([developer.chrome.com/docs/web-platform/prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)).

**WordPress:** good news here — you don't have to write anything yourself. As of **6.8**, Speculative Loading ships in core, enabled by default for logged-out visitors (as long as the site uses pretty permalinks), with a conservative `prefetch` + `conservative` eagerness setup. For a more aggressive default, install the standalone **Speculative Loading** plugin ([wordpress.org/plugins/speculation-rules](https://wordpress.org/plugins/speculation-rules/)), which ships with `prerender` + `moderate` instead. You can tune it via the `wp_speculation_rules_configuration` filter (change mode/eagerness or disable it entirely) and `wp_speculation_rules_href_exclude_paths` (exclude paths — URLs with query parameters are already excluded by default). Individual links or blocks can also be opted out via the `no-prefetch` / `no-prerender` CSS classes right in the editor ([make.wordpress.org/core — Speculative Loading in 6.8](https://make.wordpress.org/core/2025/03/06/speculative-loading-in-6-8/)).

## Progressive enhancement, not a dependency

The key property of this API is that browsers that don't understand it simply ignore `<script type="speculationrules">` — no error, no fallback code required. Full support (prerender plus document rules with eagerness) landed in **Chrome/Edge 109**, with `eagerness` and `where` rules arriving later, in **Chrome/Edge 121**; the earlier 105–108 releases only supported a limited, same-origin-only prerender ([developer.mozilla.org/.../Speculation_Rules_API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)). Firefox doesn't support it yet (it has a "positive standards position" on the prefetch portion but hasn't shipped anything), and Safari has had it behind an experimental, off-by-default flag since version **26.2** ([developer.mozilla.org/.../Speculation_Rules_API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)). In other words: some visitors get instant navigation, the rest get a normal one — nobody loses anything.

If you've already added [View Transitions in Astro](/en/blog/astro-view-transitions-eshop/), speculation rules are the natural next step — View Transitions solve the smooth *transition* between pages, speculation rules solve the fact that the next page's data is already waiting before the transition even starts. Together they make an ordinary server-rendered site feel like a native app. And since this is one of the few Core Web Vitals wins you can bolt on without touching your existing code, it deserves a spot near the top of any [Core Web Vitals priority list for an e-commerce site](/en/blog/cwv-eshop-priorita/) — the return on a few lines of JSON is unusually high here.
