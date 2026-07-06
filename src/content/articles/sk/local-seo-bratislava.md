---
title: "Local SEO pre Bratislavu: čo robí rozdiel v 2026"
date: 2025-10-29
read: 7
tags: ["SEO", "Process"]
excerpt: "Päť vecí, ktoré reálne hýbu rebríčkom lokálnym bratislavským firmám — Google Business Profile, konzistentný NAP, lokálne spätné odkazy, tok recenzií a LocalBusiness schema."
featured: false
---

Klient (malá ramen reštaurácia v centre BA) bol v lete na pozícii #15 pre „ramen Bratislava“. Štyri mesiace systematickej lokálnej SEO práce a teraz drží #3, občas #2. Žiadne reklamy, žiadny agentúrny SEO rozpočet 1500 EUR mesačne — len zopár vecí robených dôsledne.

Lokálne SEO v Bratislave (alebo v Košiciach, v Nitre…) má svoj rytmus. Tu je to, čo skutočne hýbe rebríčkom v roku 2026.

## 1. Kompletný Google Business Profile

Najsilnejší faktor pre umiestnenie v Map Packu. Profil musí byť:

- **Kompletne vyplnený** — všetky sekcie, nie len názov a adresa
- **Správna hlavná kategória** + vedľajšie kategórie. Pre ramen: hlavná „Ramen restaurant“, vedľajšie „Asian restaurant“, „Japanese restaurant“, „Soup restaurant“
- **Fotky každý týždeň** — pridávaj 3 – 5 fotiek týždenne. Google Business Profile API má na to metódu `media.create`. Ručne cez appku to však úplne stačí.
- **Príspevky každý týždeň** — textová novinka + fotka, „Týždenná novinka“, event, akcia
- **Q&A** — Google ti sem pridáva otázky od ľudí. Nenechaj ich bez odpovede.
- **Služby / Menu** — pre reštaurácie položky menu s cenami; pre služby štruktúrovaný katalóg služieb

Klientov prvý mesiac práce: pridal som 12 fotiek (jedlo, interiér, tím, exteriér v rôznych časoch dňa), 4 príspevky (špecialita týždňa), zodpovedal 8 nezodpovedaných otázok. Bez akýchkoľvek zmien na webe → posun z #15 na #9.

## 2. Konzistentný NAP

NAP = **N**ame, **A**ddress, **P**hone (názov, adresa, telefón). Google porovnáva, ako sa firma „ohlasuje“ naprieč webom. Nekonzistentnosť = strata dôvery.

Skontroluj, či máš na týchto miestach **identický** NAP:

- Tvoj web (pätička, kontaktná stránka) — schema markup `LocalBusiness`
- Google Business Profile
- [Firmy.sk](https://www.firmy.sk/)
- [Zoznam.sk](https://www.zoznam.sk/) (Katalóg firiem)
- [Azet katalóg](https://katalog.azet.sk/)
- Firemná stránka na Facebooku
- Firemný profil na LinkedIne

„Identický“ znamená:
- presne rovnaký formát adresy (`Vajanského nábrežie 5, 811 02 Bratislava` vs. `Vajanskeho nabr. 5, 81102 Bratislava` = rôzne)
- jeden formát telefónu (`+421 905 123 456` všade)
- jeden názov (žiadne `s.r.o.` raz tu, raz tam)

Nástroj na audit: [BrightLocal Citation Tracker](https://www.brightlocal.com/) (nie je zadarmo) alebo ručná 30-minútová kontrola.

## 3. Lokálne backlinky

Bratislavské weby, ktoré odkazujú na lokálne firmy:

- **Bratislava.sk** — sekcie pre podnikateľov, eventy
- **Mestské časti** (Staré Mesto, Ružinov…) — ich newsletter alebo kalendár podujatí
- **Bratislava Tourist Board** — výpisy na visitbratislava.com
- **Lokálne FB skupiny** — „Reštaurácie BA“, „Móda BA“, lokálne katalógové weby
- **BSK** (Bratislavský samosprávny kraj), ak je to relevantné
- **Lokálne médiá** — Bratislavské noviny, mestský magazín, podcasty

Stratégia: každý mesiac jeden lokálny outreach. Tlačová správa k novému menu, sponzoring malého eventu, hosťovanie neformálnej networkingovej akcie.

Klient získal 3 lokálne spätné odkazy cez sponzoring malého food festivalu (200 EUR) + rozhovor v Bratislavských novinách (zadarmo, stačil pitch). Domain Rating jedného z tých odkazov: 58. To výrazne posunulo lokálnu autoritu.

## 4. Stratégia recenzií

Recenzie patria medzi najsilnejšie faktory umiestnenia v Map Packu. Počet + kvalita + čerstvosť.

**Postup, ktorý funguje:**

1. **Po obsluhe** (obed dojedený, zákazník zaplatil): čašník slušne povie „Ak ste boli spokojní, ocením, keby ste nám napísali kratučkú recenziu na Google.“
2. **Podaj mu kartičku** s QR kódom → priamo na formulár recenzie (nie len na profil!). Tvar URL:
   ```
   https://search.google.com/local/writereview?placeid=ChIJ...
   ```
   placeId nájdeš [tu](https://developers.google.com/maps/documentation/places/web-service/place-id).
3. **Follow-up** (len pri take-away/online objednávkach, kde máš e-mail): 24 h po vyzdvihnutí jeden krátky e-mail „Ako vám chutilo? Recenziu môžete napísať tu.“

**Čo nerobiť:**
- Nikdy nie falošné recenzie (Google vie odhaliť vzorce ako frekvencia, IP adresa či vek účtu — postih môže byť trvalý)
- Nikdy neponúkaj recenzie za protihodnotu („zľava 10 % za recenziu“) — je to proti pravidlám Googlu a riskuješ zablokovanie profilu

**Čo robiť:**
- Odpovedaj na **všetky** recenzie (pozitívne aj negatívne). Pomalá reakcia na negatívnu je horšia než žiadna.
- Pri negatívnej recenzii: profesionálne, vecne, s ponukou riešenia mimo verejnej diskusie. Nikdy nie defenzívne.

Klient má 28 nových recenzií za 4 mesiace, priemer 4,7. Predtým: 11 recenzií za rok, priemer 4,3. To je signál nielen čerstvosti, ale aj tempa pribúdania (a to Google zaujíma).

## 5. LocalBusiness schema

JSON-LD na hlavnej stránke + kontaktnej stránke:

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Ramen Bratislava",
  "image": "https://example.sk/images/exterior.jpg",
  "@id": "https://example.sk/#restaurant",
  "url": "https://example.sk",
  "telephone": "+421905123456",
  "priceRange": "€€",
  "servesCuisine": "Japanese",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Vajanského nábrežie 5",
    "addressLocality": "Bratislava",
    "postalCode": "81102",
    "addressCountry": "SK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 48.143889,
    "longitude": 17.108889
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "11:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday","Sunday"],
      "opens": "12:00",
      "closes": "23:00"
    }
  ],
  "acceptsReservations": true
}
```

Validuj cez [validator.schema.org](https://validator.schema.org). `@type` voľ podľa typu firmy: `Restaurant`, `Dentist`, `LegalService`, `HairSalon`, `AutomotiveBusiness`…

## Čo Google ignoruje

- **Keyword stuffing v meta title** — „Ramen Bratislava | Best Ramen Bratislava | Cheap Ramen BA“ vie priniesť postih
- **Falošné recenzie** — algoritmus aj manuálny tím ich v rokoch 2025/2026 riešia agresívne
- **Skrytý NAP „po celej stránke“** — žiadny prínos, pôsobí to spamovo
- **EXIF GPS dáta v nahrávaných fotkách** — zaujímavá teória, ale nemá merateľný vplyv

## TL;DR

Lokálne SEO pre Bratislavu = kompletný Google Business Profile + konzistentný NAP + 1 lokálny spätný odkaz mesačne + organický tok recenzií + LocalBusiness schema. Žiadne agentúrne triky, len mesiac za mesiacom systematicky. Realistický časový horizont pre top 3 v Map Packu: 3 – 6 mesiacov pri menej saturovanom kľúčovom slove („ramen Bratislava“), 9 – 12 mesiacov pri vysoko konkurenčnom („kaviareň Bratislava centrum“).
