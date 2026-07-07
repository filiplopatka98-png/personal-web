---
title: "Third-party skripty, ktoré ti zabíjajú výkon (a čo s nimi)"
date: 2026-12-17
read: 8
tags: ["Performance"]
excerpt: "GTM, chaty a pixely žerú hlavné vlákno a kazia INP. Ukazujem, ako ich krotiť cez facade pattern, @next/third-parties a Partytown — bez toho, aby prestali fungovať."
featured: false
---

Napíšeš čistý web. Lighthouse svieti na zeleno, LCP pod 2,5 s, INP v pohode. Potom príde marketing s tromi riadkami: „len tam prosím hoď GTM, chat a Meta pixel." A výkon je preč. Toto nie je hypotetika — podľa HTTP Archive 2024 sú third-party skripty najčastejšou príčinou zlého INP. A INP pod 200 ms na 75. percentile je hranica, ktorú Google berie ako „good".

Poďme si prejsť, prečo to bolí, a hlavne čo s tým vieš reálne spraviť.

## Prečo to bolí: jedno vlákno, veľa hostí

JavaScript v prehliadači beží na jednom hlavnom vlákne. To isté vlákno vykresľuje layout, reaguje na kliknutia a spracúva tvoj kód. Keď GTM natiahne štyri tagy, každý z nich parsuje a exekuuje JS práve tu. Task, ktorý blokuje hlavné vlákno na 200 ms, oneskorí spracovanie eventu (horší INP) aj vykreslenie LCP elementu (horší LCP).

Problém je, že tieto skripty nemáš pod kontrolou. GTM je kontajner — čo doň marketér nasype, to sa spustí. Chat widget si stiahne vlastný bundle, často stovky kilobajtov. A pixely bežia synchrónne v momente, keď by prehliadač mal reagovať na prvý klik.

Rozdeľme si obranu na tri úrovne: **neťahaj to hneď**, **presuň to mimo hlavného vlákna**, **daj to preč z main threadu úplne**.

## Úroveň 1: Facade pattern — najväčší efekt za najmenej práce

Facade je moja prvá voľba, kedykoľvek to ide. Namiesto toho, aby si na stránku hodil celý embed, vykreslíš statickú náhradu (obrázok, tlačidlo) a skutočný skript natiahneš až po interakcii používateľa. Toto Lighthouse priamo odporúča ako audit „Lazy load third-party resources with facades".

Vzor je jednoduchý:

- **Na load:** pridáš facade (pár kilobajtov).
- **Na mouseover:** facade sa `preconnect`-ne k third-party doméne.
- **Na klik:** facade sa nahradí skutočným produktom.

Klasický príklad je YouTube. Bežný embed ťahá cez pol megabajtu. `lite-youtube-embed` od Paula Irisha (ktorý Lighthouse spomína menom) vyzerá ako reálny prehrávač, ale skutočný iframe natiahne až po kliknutí:

```html
<!-- namiesto <iframe src="youtube.com/embed/..."> -->
<link rel="stylesheet" href="/lite-yt-embed.css" />
<script src="/lite-yt-embed.js" defer></script>

<lite-youtube videoid="dQw4w9WgXcQ" playlabel="Prehrať video">
</lite-youtube>
```

Pre live chaty (Intercom, Drift, Help Scout, Facebook Messenger) Lighthouse odporúča `react-live-chat-loader` od Calibre. Ten vykreslí falošnú bublinu chatu a skutočný widget stiahne až po kliknutí. V praxi typicky ušetríš stovky kilobajtov JS z počiatočného načítania — a väčšina návštevníkov chat aj tak nikdy neotvorí.

Ak riešiš aj samotný layout shift z týchto embedov, k tomu mám samostatný rozbor o [CLS z dynamických bannerov na mobile](/blog/cls-mobil-banner/).

## Úroveň 2: Načasovanie cez oficiálne komponenty

Ak si na Next.js, nevymýšľaj koleso okolo `<script>` tagov. Balík `@next/third-parties` (oficiálny, od Vercelu, pochádza z práce Chrome Aurora tímu) rieši načasovanie a hydratáciu za teba:

```tsx
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <GoogleTagManager gtmId="GTM-XXXX" />
      <body>{children}</body>
    </html>
  )
}
```

Komponent načíta GTM správne, vyhne sa hydration mismatchom a poskytuje typovaný `sendGTMEvent`. Pre custom eventy nemusíš siahať do `window.dataLayer` ručne. To isté existuje pre GA (`GoogleAnalytics`) aj pre YouTube (`YouTubeEmbed`, ktorý interne používa práve `lite-youtube-embed`).

Toto samo osebe nepresunie skripty mimo hlavného vlákna — ale zaručí, že sa načítajú v správnom momente a nebijú sa s renderom. Pre väčšinu projektov je to dostatočná úroveň. Ak riešiš INP hlbšie, mám k tomu [samostatný postup, čo reálne pomohlo pod 200 ms](/blog/inp-pod-200ms-wordpress/).

## Úroveň 3: Partytown — skripty do web workera

Keď facade nepomôže (analytika musí bežať vždy, nielen po kliku) a skript ti aj tak žerie main thread, prichádza na rad ťažší kaliber: **Partytown**. Presunie resource-intensive third-party skripty do web workera, mimo hlavného vlákna. Tvoj kód dostane vlákno pre seba.

Aktuálna verzia je 0.14.0 (vyšla 22. mája 2026), projekt spravuje QwikDev. Skript vypneš na main threade cez `type="text/partytown"` a Partytown ho spustí vo workeri. Pre GTM potrebuješ forward konfiguráciu, aby sa `dataLayer.push` volania preposielali do workera:

```html
<script>
  partytown = {
    forward: ['dataLayer.push'],
  };
</script>

<!-- GTM skript, ale vo workeri -->
<script type="text/partytown">
  (function(w,d,s,l,i){/* štandardný GTM snippet */})
  (window,document,'script','dataLayer','GTM-XXXX');
</script>
```

Dobrá správa: GA4 už netreba proxovať — odpovede z `google-analytics.com` chodia so správnymi CORS hlavičkami. Staršie verzie GA proxy vyžadovali, ale tie sú sunset.

Kde je háčik: **Partytown je stále v beta a negarantuje funkčnosť v každom scenári.** Preto ho neberiem ako default. Beriem ho vtedy, keď mám konkrétny skript, ktorý merateľne blokuje main thread, viem to podložiť profilom vo WebPageTeste, a viem si overiť, že po presune stále posiela dáta správne. Nasadiť Partytown „naslepo" na celý web a dúfať je recept na tiché výpadky trackingu.

## Ako sa rozhodujem v praxi

Postupujem zhora dole:

1. **Treba to vôbec?** Polovica pixelov na weboch je duplicitná alebo mŕtva. Najrýchlejší skript je ten, čo tam nie je.
2. **Dá sa to za facade?** YouTube, Vimeo, chaty, mapy — takmer vždy áno. Toto rieš prvé, efekt je najväčší.
3. **Beží to cez oficiálny komponent so správnym načasovaním?** Na Next.js `@next/third-parties`, inde aspoň `defer`/`async` a nie synchronne v `<head>`.
4. **Blokuje to stále main thread podľa profilu?** Až teraz Partytown — cielene, na konkrétny skript, s overením že tracking žije.

Nemeraj pocitom. Otvor DevTools Performance panel alebo [WebPageTest report](/blog/webpagetest-za-5-minut/) a pozri sa, ktorý skript koľko main-thread času žerie. Optimalizovať skript, ktorý ťa nič nestojí, je stratený čas — a naopak, jeden agresívny chat widget vie sám pokaziť celé INP.

## Zhrnutie

Third-party skripty nie sú nepriateľ — biznis ich potrebuje. Nepriateľ je nekontrolované ťahanie všetkého synchrónne na main thread. Facade pattern vyrieši väčšinu embedov za pár riadkov, oficiálne komponenty ustrážia načasovanie a Partytown je posledná záchrana pre skripty, ktoré musia bežať vždy, ale nesmú blokovať. Priorita je jasná: najprv vyhoď zbytočné, potom odlož zvyšok, a až nakoniec presúvaj do workera.
