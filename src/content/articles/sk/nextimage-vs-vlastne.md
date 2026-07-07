---
title: "next/image vs vlastné riešenie: kedy sa oplatí čo"
date: 2026-11-26
read: 8
tags: ["Next.js", "Performance"]
excerpt: "next/image ti dá blur placeholder, srcset a AVIF zadarmo — ale na Verceli ho platíš za transformáciu. Kedy nechať komponent robiť robotu a kedy si napísať vlastné."
featured: false
---

`next/image` je jeden z tých komponentov, ktoré ti zožerú polovicu Core Web Vitals problémov skôr, než ich stihneš mať. Automaticky generuje `srcset`, servíruje AVIF alebo WebP podľa `Accept` hlavičky, dá ti blur placeholder a cez `priority` rieši preload LCP obrázka. To všetko z jedného importu.

Lenže „zadarmo“ v tomto prípade platí len o API. O peniazoch a o kontrole nad pipeline to už neplatí. Poďme si to rozobrať prakticky — kedy nechám `next/image` robiť robotu a kedy siahnem po vlastnom riešení.

## Čo ti next/image reálne dá

Aby sme sa bavili o tom istom. V Next.js 16 (aktuálna stabilná vetva v čase písania) komponent štandardne robí toto:

```jsx
import Image from 'next/image'
import hero from './hero.jpg'

export default function Hero() {
  return (
    <Image
      src={hero}
      alt="Detský kútik s hračkami"
      priority
      placeholder="blur"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  )
}
```

Pri statickom importe (`./hero.jpg`) dostaneš `width`, `height` a `blurDataURL` automaticky — nemusíš ich písať ručne, čím padá celá kategória CLS problémov z nesprávnych rozmerov. `priority` pridá `fetchpriority="high"` a preload na LCP obrázok. Podľa Googlu vie samotné `fetchpriority="high"` na LCP obrázku stiahnuť LCP z 2,6 s na 1,9 s — takže toto nie je kozmetika.

`sizes` je pritom najčastejšie ignorovaný, ale najdôležitejší atribút. Bez neho browser nevie, aký veľký variant zo `srcset` má vybrať, a stiahne zbytočne veľký. Toto je vec, ktorú aj vo vlastnom riešení musíš vyriešiť rovnako — komponent ti to len pripomína.

Formáty rieši `next.config.js`:

```js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 dní
  },
}
```

AVIF komprimuje asi o 20 % lepšie ako WebP, ale kóduje sa približne o 50 % dlhšie — takže prvý request na daný variant je pomalší, ďalšie idú z cache. Podpora je dnes vysoká: podľa dát z caniuse má WebP okolo 96 % a AVIF okolo 95 % globálneho pokrytia, takže dvojica AVIF + WebP fallback pokryje prakticky každého.

## Kde je háčik: cena a kontrola

Na Verceli sa optimalizácia obrázkov účtuje. Podľa aktuálneho cenníka (limity platné vo februári 2026) máš na Hobby pláne 5 000 transformácií, 300 000 cache reads a 100 000 cache writes mesačne zadarmo. Nad rámec platíš od 0,05 $ za 1 000 transformácií, od 0,40 $ za milión cache reads a od 4 $ za milión cache writes. Transformácia sa účtuje za každý cache MISS a STALE.

Pre malý web s pár desiatkami obrázkov je to nula. Pre eshop s tisíckami produktov, kde každý produkt má viac variantov krát viac breakpointov, sa to vie nasčítať do reálnej položky na faktúre. Preto Vercel sám odporúča `minimumCacheTTL` alebo statické importy (tie nastavia `Cache-Control` na rok) — presne aby si znížil počet transformácií.

Druhý háčik nie je cena, ale kontrola. Vercelová optimalizácia je čierna skrinka: nevidíš do enkodéra, nemôžeš meniť chroma subsampling, nevieš pustiť vlastný `sharp` pipeline s presnými parametrami. Pre 90 % projektov je to úplne fajn. Pre projekt, kde na kvalite obrázka stojí biznis (fotograf, e-shop s módou), ti to začne prekážať.

## Vlastné riešenie: dve rôzne veci

Keď povieme „vlastné riešenie“, myslíme tým väčšinou jednu z dvoch vecí — a je dôležité ich nemiešať.

**Prvá: vlastný loader nad externou službou.** Necháš `next/image` API, ale transformáciu odovzdáš Cloudinary, imgix, alebo Cloudflare Images. Konfiguruješ `loaderFile`:

```jsx
// image-loader.js
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto']
  return `https://example.com/cdn-cgi/image/${params.join(',')}/${src}`
}
```

```js
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
}
```

Tým si nechal komfort komponentu (`srcset`, `sizes`, lazy loading), ale transformáciu platíš službe, ktorú si vybral — a tá býva pri objeme lacnejšia a dáva ti viac kontroly.

**Druhá: úplne vlastný `<img>` s ručne pripravenými variantmi.** Tu už `next/image` nepoužiješ. Obrázky pregeneruješ vopred (napr. cez `sharp` v build kroku alebo cez WordPress, ak ide o headless setup) a servíruješ statický `<picture>`:

```html
<picture>
  <source
    srcset="/img/hero-800.avif 800w, /img/hero-1600.avif 1600w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/avif" />
  <img
    src="/img/hero-1600.jpg"
    width="1600" height="900"
    alt="Detský kútik s hračkami"
    loading="eager" fetchpriority="high" decoding="async" />
</picture>
```

Native `loading="lazy"` funguje vo všetkých major browseroch (Chrome, Edge, Firefox, Safari) natívne už od roku 2020, `fetchpriority` a `srcset` tiež. Takže všetko, čo `next/image` robí, vieš spraviť ručne — otázka je len, koľko práce ti to dá a kto to bude udržiavať. K rozdielu medzi native a custom lazy-loadingom mám samostatný [rozbor o lazy-loadingu obrázkov](/blog/image-lazy-loading-native-vs-custom/).

## Ako sa rozhodujem

Toto je moje praktické pravidlo, ktoré vo väčšine projektov funguje:

**Nechaj `next/image` s Vercelovou optimalizáciou**, ak je web malý až stredný, hostuješ na Verceli a objem obrázkov ťa nedostáva nad free tier. Nič nevymýšľaj. Ušetrený čas hodíš do `sizes` atribútov a `priority` na správnom obrázku — tam je 80 % efektu.

**Nechaj `next/image`, ale prehoď loader** na Cloudflare Images / imgix / Cloudinary, ak máš veľa obrázkov, riešiš náklady, alebo si na inom hostingu než Vercel (kde je Vercelova optimalizácia aj tak nedostupná). Získaš rovnaké API za predvídateľnejšiu cenu. Ak riešiš voľbu hostingu širšie, pozri [porovnanie Vercel vs Cloudflare vs vlastný node](/blog/vercel-vs-cloudflare-vs-vps/).

**Choď do úplne vlastného `<picture>`**, ak potrebuješ presnú kontrolu nad enkódovaním, obrázky sú vopred známe a menia sa zriedka (marketingový web, landing), alebo keď na projekte `next/image` nemáš k dispozícii (napr. čistý statický export bez optimalizačného servera). Pri statickom exporte totiž musíš aj tak nastaviť `unoptimized: true` alebo vlastný loader — komponent bez optimalizačnej vrstvy stráca polovicu zmyslu.

Malá poznámka k self-hostingu: od Next.js 15 sa `sharp` v standalone móde inštaluje automaticky, takže `next/image` optimalizácia funguje out-of-the-box aj mimo Vercelu. Pozor len na to, že `sharp` má natívne bindingy — musí byť skompilovaný pre cieľovú platformu, nie pre tvoj mac. Ak kopíruješ `node_modules` z macu do Alpine kontajnera, bindingy nesadnú a optimalizácia padne. Inštaluj `sharp` v runner stage pre správnu platformu.

## Zhrnutie

`next/image` nie je „vždy áno“ ani „vždy nie“. Je to pohodlný default, ktorý ti vyrieši `srcset`, formáty, blur a LCP preload — a za ktorý na Verceli platíš za transformácie. Malý web: nechaj tak. Veľa obrázkov alebo iný hosting: prehoď loader. Kritická kvalita alebo statický web: vlastné `<picture>`. Nech si ale vyberieš čokoľvek, `sizes` a `fetchpriority` na LCP obrázku musíš dostať správne — to je vec, ktorú za teba nevyrieši žiadny komponent. Ak ťa trápi konkrétne pomalý LCP, mám [rozbor najčastejších príčin LCP nad 2,5 s](/blog/lcp-nad-2-5s-pricin/).
