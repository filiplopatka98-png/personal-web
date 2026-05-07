---
title: "Next.js ISR ako náhrada cron-u na malých weboch"
date: 2025-10-12
read: 6
tags: ["Next.js", "DevOps"]
excerpt: "Malý web potrebuje refresh dát každú hodinu, ale nechceš platiť za cron infraštruktúru. ISR ti to vyrieši — s pár podmienkami."
featured: false
---

Klient mal portfolio site v Next.js, ktorý ťahal blog posts z headless WP cez REST API. "Chcem aby sa to refresh-lo každú hodinu, ale nechcem platiť za GitHub Actions ani Vercel cron job." OK. ISR to spraví zadarmo.

## ISR v jednom odseku

Incremental Static Regeneration je vec, ktorú vie iba Next.js. **Vygeneruje stránku staticky pri build-e, ale po určitom čase ju regeneruje na pozadí**, keď príde request. User vždy dostane statický HTML (rýchle), regenerácia sa deje async po response.

Dva spôsoby triggera:

1. **Time-based** — `export const revalidate = 3600` v page.
2. **On-demand** — `revalidatePath('/blog')` alebo `revalidateTag('posts')` z route handler-a (webhook).

## Time-based ISR namiesto cron-u

Klasický scenár: blog feed, ktorý načíta dáta z externe API a chceme ich raz za hodinu osviežiť. Bez ISR by si si zriaďoval cron, ktorý by volal API a ukladal cache niekam. S ISR:

```tsx
// app/blog/page.tsx
export const revalidate = 3600; // 1 hour

export default async function BlogPage() {
  const posts = await fetch("https://cms.example.com/wp-json/wp/v2/posts", {
    next: { revalidate: 3600 },
  }).then(r => r.json());

  return <PostList posts={posts} />;
}
```

Každý prvý request po 1 hodine spustí regeneráciu. **User stále vidí starú verziu** počas regenerácie (žiadne čakanie). Po dobehu sa cache aktualizuje.

To je crucial difference voči cron-u: **ISR sa spúšťa pri request-e, nie podľa hodín**. Ak na blog 6 hodín nikto nepríde, prvý návštevník po 6 hodinách dostane okamžite starú verziu a regenerácia sa spustí na pozadí. Ten návštevník neuvidí čerstvé dáta — tie uvidí **druhý** návštevník.

## On-demand revalidate z webhook-u

Pre prípady, keď klient publikne nový post a nechce čakať hodinu, pridám webhook:

```tsx
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

V WordPress klientovi pridám hook:

```php
add_action('publish_post', function($post_id) {
  wp_remote_post('https://my-site.com/api/revalidate', [
    'headers' => ['x-webhook-secret' => MY_SECRET],
    'body' => json_encode(['post_id' => $post_id]),
  ]);
});
```

Po publish-i v WP sa do 2 sekúnd refresh-ne `/blog` na produkcii. **Bez cron-u, bez polling-u, bez vlastného infraštruktúrneho overhead-u.**

## Kedy ISR ako náhrada cron-u nestačí

ISR má ostré limity. **Nepoužívaj ho ako "scheduled job runner".**

Veci, ktoré ISR **nezvládne**:

1. **Side effects** — odoslať email, zapísať do DB, zavolať tretie API. ISR regeneruje **pohľad**, nie business logiku. Nemá garanciu execution.
2. **Cold cache po deploye** — po každom deploy-i je cache prázdna a prvý request každú stránku regeneruje. Pri 200 stránkach to znamená 200 cold-start regenerácií. Riešenie: warm-up script, ktorý po deploy-i navštívi top stránky.
3. **Traffic-driven garancia** — ak na stránku mesiac nikto nepríde, ISR sa **nespustí**. Cron sa spustí vždy.
4. **Presné časové okno** — ISR negarantuje "presne o 3:00 ráno". Garantuje "po 1 hodine od posledného render-u, pri prvom request-e".

Pre side-effecty (email digest, DB cleanup, batch import) potrebuješ skutočný cron. Možnosti:

- **Vercel Cron Jobs** — €20/mes na Pro plane, povolené ako súčasť subscription.
- **GitHub Actions** schedule — zadarmo do 2000 min/mes.
- **Upstash QStash** — pay-per-request, lacné pre malé use cases.
- **Vlastný VPS s `cron`** — ak už máš VPS pre niečo iné.

## Reálny example: WP CMS publish flow

Setup, ktorý mám na 4 klientskych projektoch:

1. WordPress instance ako headless CMS na subdoméne (`cms.klient.sk`).
2. Next.js produkčný site s ISR `revalidate: 3600` ako safety net.
3. WP plugin volá `https://klient.sk/api/revalidate` pri:
   - Post publish/update/delete
   - Page publish/update/delete
   - Menu update (revalidate `/`)
   - Featured image update (revalidate špecifickú stránku)

Klient publishne článok → o 2 sekundy je live. Žiadny cron, žiadny polling. **Hosting bill: €0 navyše**. (Vercel Hobby plan, ktorý je free pre osobné a malé komerčné projekty.)

## TL;DR

Ak potrebuješ **refresh dát každých X hodín** alebo **on-publish update**, ISR ti to spraví zadarmo. Ak potrebuješ **scheduled job s side effectami** (email, DB write), potrebuješ skutočný cron. Pre malé weby ISR pokrýva 90 % use cases. Cron si rezervuj na zvyšných 10 %.
