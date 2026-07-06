---
title: "Next.js ISR ako náhrada cron-u na malých weboch"
date: 2025-10-12
read: 6
tags: ["Next.js", "DevOps"]
excerpt: "Malý web potrebuje osviežiť dáta každú hodinu, ale nechceš platiť za cron infraštruktúru. ISR ti to vyrieši — s pár podmienkami."
featured: false
---

Klient mal portfóliovú stránku v Next.js, ktorá ťahala články z headless WordPressu cez REST API. „Chcem, aby sa to obnovilo každú hodinu, ale nechcem platiť za GitHub Actions ani za Vercel cron.“ OK. ISR to spraví zadarmo.

## ISR v jednom odseku

Incremental Static Regeneration je vec, ktorú v tejto podobe vie iba Next.js. **Vygeneruje stránku staticky pri builde, ale po určitom čase ju na pozadí zregeneruje**, keď príde request. Návštevník vždy dostane statické HTML (rýchle), regenerácia beží asynchrónne po odoslaní odpovede.

Dva spôsoby, ako to spustiť:

1. **Časové (time-based)** — `export const revalidate = 3600` na úrovni stránky.
2. **Na požiadanie (on-demand)** — `revalidatePath('/blog')` alebo `revalidateTag('posts')` z route handlera (webhook).

## Časové ISR namiesto cronu

Klasický scenár: blogový feed, ktorý načíta dáta z externého API a chceme ich raz za hodinu osviežiť. Bez ISR by si si zriaďoval cron, ktorý by volal API a niekam ukladal cache. S ISR:

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

Prvý request po uplynutí 1 hodiny spustí regeneráciu. **Návštevník počas nej stále vidí starú verziu** (žiadne čakanie). Po dobehnutí sa cache aktualizuje.

To je zásadný rozdiel oproti cronu: **ISR sa spúšťa pri requeste, nie podľa hodín**. Ak na blog 6 hodín nikto nepríde, prvý návštevník po 6 hodinách dostane okamžite starú verziu a regenerácia sa spustí na pozadí. Ten návštevník ešte neuvidí čerstvé dáta — tie uvidí až **druhý** návštevník.

## Revalidácia na požiadanie z webhooku

Pre prípady, keď klient publikne nový článok a nechce čakať hodinu, pridám webhook:

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

Na strane WordPressu pridám hook:

```php
add_action('publish_post', function($post_id) {
  wp_remote_post('https://my-site.com/api/revalidate', [
    'headers' => ['x-webhook-secret' => MY_SECRET],
    'body' => json_encode(['post_id' => $post_id]),
  ]);
});
```

Po publikovaní vo WordPresse sa `/blog` na produkcii osvieži do 2 sekúnd. **Bez cronu, bez pollingu, bez vlastnej infraštruktúry navyše.**

## Kedy ISR ako náhrada cronu nestačí

ISR má ostré limity. **Nepoužívaj ho ako „scheduled job runner“.**

Veci, ktoré ISR **nezvládne**:

1. **Vedľajšie efekty (side effects)** — odoslať e-mail, zapísať do databázy, zavolať tretie API. ISR regeneruje **pohľad**, nie biznis logiku. Nemá garanciu, že sa vôbec vykoná.
2. **Studená cache po deployi** — po každom deployi je cache prázdna a prvý request každú stránku regeneruje. Pri 200 stránkach to znamená 200 cold-start regenerácií. Riešenie: warm-up skript, ktorý po deployi navštívi najdôležitejšie stránky.
3. **Garancia nezávislá od návštevnosti** — ak na stránku mesiac nikto nepríde, ISR sa **nespustí**. Cron sa spustí vždy.
4. **Presné časové okno** — ISR negarantuje „presne o 3:00 ráno“. Garantuje „po 1 hodine od posledného renderu, pri prvom requeste“.

Na vedľajšie efekty (e-mailový digest, čistenie databázy, dávkový import) potrebuješ skutočný cron. Možnosti:

- **Vercel Cron Jobs** — dostupné na všetkých plánoch, no na Hobby pláne maximálne raz denne; per-minútovú kadenciu odomkne až Pro plán (20 USD/mesiac za používateľa).
- **GitHub Actions** schedule — zadarmo do 2 000 minút/mesiac na privátnych repozitároch (pri verejných je Actions zadarmo).
- **Upstash QStash** — pay-per-request (1 USD za 100-tisíc správ), s free tierom 1 000 správ denne — lacné pre malé use casy.
- **Vlastný VPS s `cron`** — ak už nejaký VPS máš na niečo iné.

## Reálny príklad: publikačný tok cez WordPress CMS

Setup, ktorý mám na 4 klientskych projektoch:

1. WordPress ako headless CMS na subdoméne (`cms.klient.sk`).
2. Produkčná Next.js stránka s ISR `revalidate: 3600` ako safety net.
3. WP plugin volá `https://klient.sk/api/revalidate` pri:
   - publikovaní/úprave/zmazaní článku,
   - publikovaní/úprave/zmazaní stránky,
   - úprave menu (revaliduje `/`),
   - zmene náhľadového obrázka (revaliduje konkrétnu stránku).

Klient publikne článok → o 2 sekundy je live. Žiadny cron, žiadny polling. **Hosting navyše: 0 EUR.** Pozor ale: Vercel Hobby plán je len na osobné, nekomerčné projekty — akonáhle ide o platený klientsky web, si podľa podmienok Vercelu na Pro pláne (20 USD/mesiac za používateľa). Pri malých weboch to preto väčšinou hostujem inde, alebo klientovi rovno počítam Pro.

## TL;DR

Ak potrebuješ **osviežovať dáta každých X hodín** alebo **aktualizovať pri publikovaní**, ISR ti to spraví zadarmo. Ak potrebuješ **naplánovanú úlohu s vedľajšími efektami** (e-mail, zápis do databázy), potrebuješ skutočný cron. Pre malé weby ISR pokrýva 90 % prípadov. Cron si rezervuj na zvyšných 10 %.
