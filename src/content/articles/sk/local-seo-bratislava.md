---
title: "Local SEO pre Bratislavu: čo robí rozdiel v 2026"
date: 2025-10-29
read: 7
tags: ["SEO", "Process"]
excerpt: "Päť vecí ktoré pomáhajú lokálnym BA biznisom — Google Business Profile, NAP, lokálne backlinky, review flow, LocalBusiness schema."
featured: false
---

Klient (malá ramen reštaurácia v centre BA) bol v lete na pozícii #15 pre "ramen Bratislava". 4 mesiace consistent local SEO práce a teraz drží #3, občas #2. Žiadne ads, žiadny SEO agency budget €1500/mes — len zopár vecí robených systematicky.

Lokál SEO v Bratislave (alebo Košiciach, Nitre...) má svoj rytmus. Tu je, čo skutočne hýbe rebríčkom v 2026.

## 1. Google Business Profile complete

Najsilnejší faktor pre Map Pack ranking. Profil musí byť:

- **Kompletne vyplnený** — všetky sekcie, nie len name + address
- **Správna primary kategória** + secondary kategórie. Pre ramen: primary "Ramen restaurant", secondary "Asian restaurant", "Japanese restaurant", "Soup restaurant"
- **Photos weekly** — fyzicky upload-uj 3-5 foto týždenne. Google Business Profile API má `mediaItems.create`. Manuálne cez app stačí.
- **Posts weekly** — text update + photo, "Týždenná novinka", event, akcia
- **Q&A** — Google ti tam pridáva otázky od ľudí. Nepustí to bez odpovede.
- **Services / Menu** — pre reštaurácie menu items s cenami; pre service business štruktúrovaný service catalog

Klientov prvý mesiac práce: pridal som 12 fotiek (jedlo, interiér, tím, exteriér v rôznych časoch dňa), 4 posty (špecialita týždňa), zodpovedal 8 nezodpovedaných otázok. Bez akýchkoľvek zmien na webe → posun z #15 na #9.

## 2. NAP consistency

NAP = **N**ame, **A**ddress, **P**hone. Google porovnáva, ako sa biznis "ohlasuje" naprieč webom. Inkonzistencia = trust hit.

Skontroluj, že na týchto miestach máš **identický** NAP:

- Tvoj web (footer, kontakt page) — schema markup `LocalBusiness`
- Google Business Profile
- [Firmy.sk](https://www.firmy.sk/)
- [Zoznam.sk](https://www.zoznam.sk/) (Katalóg firiem)
- [Azet katalóg](https://katalog.azet.sk/)
- Facebook business page
- LinkedIn company page

"Identický" znamená:
- presne rovnaký formát adresy (`Vajanského nábrežie 5, 811 02 Bratislava` vs `Vajanskeho nabr. 5, 81102 Bratislava` = rôzne)
- jeden formát telefónu (`+421 905 123 456` všade)
- jeden názov (žiadne `s.r.o.` raz tu, raz tam)

Audit nástroj: [Brightlocal Citation Tracker](https://www.brightlocal.com/) (nie zadarmo) alebo manuálne 30-min check.

## 3. Lokálne backlinky

Bratislavské weby, ktoré linkujú na lokálne biznisy:

- **Bratislava-mesto.sk** sekcie pre podnikateľov, eventy
- **Mestské časti** (Staré mesto, Ružinov...) — ich newsletter / event calendar
- **Bratislava Tourism Board** — visit bratislava listings
- **Lokálne FB skupiny** — "Restauracie BA", "Móda BA", lokálne directory weby
- **BSK** (Bratislavský samosprávny kraj) ak relevantné
- **Lokálne médiá** — Bratislavské noviny, mestský magazín, podcasty

Strategy: každý mesiac jeden lokálny outreach. Press release pre nové menu, sponsorship malého eventu, host neformálnu networking session.

Klient získal 3 lokálne backlinky cez sponzorstvo malého food festivalu (€200) + interview v Bratislavské Noviny (zadarmo, len pitch). Domain Rating jeden z tých backlinkov: 58. To posunulo lokálnu authority výrazne.

## 4. Review strategy

Reviews sú top 3 ranking faktor pre Map Pack. Quantity + quality + recency.

**Request flow** ktorý funguje:

1. **Po service** (obed dojedený, zákazník zaplatil): server slušne povie "Ak ste boli spokojní, ocením, ak by ste nám napísali kratičkú recenziu na Google."
2. **Hand them a card** s QR kódom → priamo na review form (nie len na profil!). Url tvar:
   ```
   https://search.google.com/local/writereview?placeid=ChIJ...
   ```
   placeId nájdeš [tu](https://developers.google.com/maps/documentation/places/web-service/place-id).
3. **Follow-up** (len pre take-away/online order kde máš email): 24h po pickup-e jeden krátky email "Ako sa vám páčilo? Recenzia tu."

**Don't:**
- Nikdy fake reviews (Google to vie detekovať patterns ako frequency, IP, account age — penalty môže byť permanentná)
- Nikdy "incentivize" reviews ("zľava 10 % za review") — proti Google ToS, riziko suspend

**Do:**
- Odpovedaj na **všetky** reviews (positive aj negative). Pomalá negative response je horšia než žiadna.
- Pri negatívnej review: profesionálne, faktickou linkou, ponuka offline rieenia. Nikdy defensive.

Klient má 28 nových reviews za 4 mesiace, priemer 4.7. Pred tým: 11 reviews za rok, priemer 4.3. To je signal nielen recency, ale aj velocity (Google to zaujíma).

## 5. LocalBusiness schema

JSON-LD na hlavnej stránke + kontakt page:

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

Validuj cez [validator.schema.org](https://validator.schema.org). `@type` voľ podľa biznisu: `Restaurant`, `Dentist`, `LegalService`, `HairSalon`, `AutomotiveBusiness`...

## Čo Google ignoruje

- **Keyword stuffing v meta title** — "Ramen Bratislava | Best Ramen Bratislava | Cheap Ramen BA" je penal-able
- **Fake reviews** — algoritmus aj manual review tím to riešia agresívne v 2025/2026
- **Hidden NAP "all over the page"** — žiadny benefit, looks spammy
- **EXIF GPS data v image upload-e** — zaujímavá teória, ale nemajú merateľný impact

## TL;DR

Local SEO pre Bratislavu = Google Business Profile complete + NAP consistent + 1 lokálny backlink/mesiac + organický review flow + LocalBusiness schema. Žiadne agency tricks, len mesiac za mesiacom systematicky. Realistický timeline pre top 3 v Map Pack: 3-6 mesiacov pri non-saturated keyword (ramen Bratislava), 9-12 mesiacov pri high-comp (kaviareň Bratislava centrum).
