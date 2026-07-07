---
title: "The Third-Party Scripts Killing Your Performance (and What to Do About It)"
date: 2026-12-17
read: 8
tags: ["Performance"]
excerpt: "GTM, chat widgets, and pixels eat the main thread and wreck INP. Here's how to tame them with the facade pattern, @next/third-parties, and Partytown — without breaking them."
featured: false
---

You ship a clean site. Lighthouse is green, LCP under 2.5s, INP fine. Then marketing shows up with three lines: "just drop in GTM, the chat, and the Meta pixel, please." And your performance is gone. This isn't hypothetical — per HTTP Archive 2024, third-party scripts are the single most common cause of poor INP. And INP under 200ms at the 75th percentile is the line Google treats as "good."

Let's walk through why it hurts, and more importantly what you can actually do about it.

## Why it hurts: one thread, many guests

JavaScript in the browser runs on a single main thread. That same thread renders layout, responds to clicks, and runs your code. When GTM loads four tags, each one parses and executes JS right there. A task that blocks the main thread for 200ms delays event processing (worse INP) and delays rendering the LCP element too (worse LCP).

The problem is that you don't control these scripts. GTM is a container — whatever a marketer dumps in gets executed. A chat widget pulls its own bundle, often hundreds of kilobytes. And pixels run synchronously at the exact moment the browser should be responding to the first click.

Let's split the defense into three levels: **don't load it right away**, **move it off the main thread**, **get it off the main thread entirely**.

## Level 1: Facade pattern — biggest win for the least work

A facade is my first choice whenever it's an option. Instead of dropping the full embed onto the page, you render a static placeholder (an image, a button) and only load the real script after a user interaction. Lighthouse recommends exactly this as its "Lazy load third-party resources with facades" audit.

The pattern is simple:

- **On load:** add the facade (a few kilobytes).
- **On mouseover:** the facade `preconnect`s to the third-party domain.
- **On click:** the facade replaces itself with the real product.

The classic example is YouTube. A normal embed pulls over half a megabyte. Paul Irish's `lite-youtube-embed` (which Lighthouse mentions by name) looks like the real player but only loads the actual iframe after a click:

```html
<!-- instead of <iframe src="youtube.com/embed/..."> -->
<link rel="stylesheet" href="/lite-yt-embed.css" />
<script src="/lite-yt-embed.js" defer></script>

<lite-youtube videoid="dQw4w9WgXcQ" playlabel="Play video">
</lite-youtube>
```

For live chats (Intercom, Drift, Help Scout, Facebook Messenger), Lighthouse recommends Calibre's `react-live-chat-loader`. It renders a fake chat bubble and only fetches the real widget after a click. In practice you typically save hundreds of kilobytes of JS from the initial load — and most visitors never open the chat anyway.

If you're also fighting the layout shift these embeds cause, I've got a separate breakdown on [CLS from dynamic banners on mobile](/en/blog/cls-mobil-banner/).

## Level 2: Timing via official components

If you're on Next.js, don't reinvent the wheel around `<script>` tags. The `@next/third-parties` package (official, from Vercel, born out of the Chrome Aurora team's work) handles timing and hydration for you:

```tsx
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-XXXX" />
      <body>{children}</body>
    </html>
  )
}
```

The component loads GTM correctly, avoids hydration mismatches, and gives you a typed `sendGTMEvent`. You don't have to poke at `window.dataLayer` by hand for custom events. The same exists for GA (`GoogleAnalytics`) and for YouTube (`YouTubeEmbed`, which internally uses `lite-youtube-embed`).

This on its own won't move scripts off the main thread — but it guarantees they load at the right moment and don't fight your render. For most projects that's enough. If you're going deeper on INP, I've got a [separate write-up on what actually got it under 200ms](/en/blog/inp-pod-200ms-wordpress/).

## Level 3: Partytown — scripts into a web worker

When a facade won't help (analytics has to run always, not just after a click) and a script still eats your main thread, it's time for the heavier tool: **Partytown**. It relocates resource-intensive third-party scripts into a web worker, off the main thread. Your code gets the thread to itself.

The current version is 0.14.0 (released May 22, 2026), maintained by QwikDev. You disable a script on the main thread with `type="text/partytown"` and Partytown runs it in the worker. For GTM you need a forward config so `dataLayer.push` calls get relayed into the worker:

```html
<script>
  partytown = {
    forward: ['dataLayer.push'],
  };
</script>

<!-- GTM script, but in the worker -->
<script type="text/partytown">
  (function(w,d,s,l,i){/* standard GTM snippet */})
  (window,document,'script','dataLayer','GTM-XXXX');
</script>
```

Good news: GA4 no longer needs proxying — responses from `google-analytics.com` come with the correct CORS headers. Older GA versions required a proxy, but those are sunset.

The catch: **Partytown is still in beta and doesn't guarantee it'll work in every scenario.** That's why I don't treat it as a default. I reach for it when I have a specific script that measurably blocks the main thread, I can back it up with a WebPageTest profile, and I can verify it still sends data correctly after the move. Deploying Partytown blindly across a whole site and hoping is a recipe for silent tracking outages.

## How I decide in practice

I work top-down:

1. **Do we even need it?** Half the pixels on the average site are duplicated or dead. The fastest script is the one that isn't there.
2. **Can it go behind a facade?** YouTube, Vimeo, chats, maps — almost always yes. Do this first; the payoff is the biggest.
3. **Is it running through an official component with correct timing?** On Next.js, `@next/third-parties`; elsewhere, at least `defer`/`async` and not synchronously in the `<head>`.
4. **Is it still blocking the main thread per the profile?** Only now Partytown — targeted, on a specific script, verified that tracking still lives.

Don't measure by gut. Open the DevTools Performance panel or a [WebPageTest report](/en/blog/webpagetest-za-5-minut/) and look at which script eats how much main-thread time. Optimizing a script that costs you nothing is wasted effort — and conversely, one aggressive chat widget can wreck your INP all by itself.

## Wrap-up

Third-party scripts aren't the enemy — the business needs them. The enemy is uncontrolled loading of everything synchronously on the main thread. The facade pattern handles most embeds in a few lines, official components guard the timing, and Partytown is the last resort for scripts that must always run but must not block. The priority is clear: throw out the useless first, defer the rest, and only then move it into a worker.
