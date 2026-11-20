---
name: "krivosik.sk"
kind: "Nový web na mieru · WordPress"
year: "2026"
role: "WordPress Developer · priebežná správa"
duration: "2 dni build + ongoing"
client: "Ľubomír Krivošík"
url: "krivosik.sk"
accent: accent
order: 29
featured: true
brief: "Nový web pre firmu na zemné a výkopové práce: formulár vedľa mapy, recenzie z Google priamo na webe a meranie dopytov. Mobilný výkon z 79 na 95 bodov, prvé zobrazenie za 1,0 s namiesto 3,4 s."
metrics:
  - value: "79 → 95"
    label: "výkon na mobile (PageSpeed)"
  - value: "3,4 → 1,0 s"
    label: "prvé zobrazenie (FCP) na mobile"
  - value: "80 → 0 ms"
    label: "blokovanie vstupu (TBT) na mobile"
stack:
  - "WordPress"
  - "Vlastná téma"
  - "Yoast SEO"
  - "Contact Form 7"
  - "Cloudflare Turnstile"
  - "Complianz"
  - "GA4"
heroCaption: "homepage · služby a telefón v hero sekcii"
mobileCaption: "úvod na mobile"
secondaryCaption: "detail realizácie · výkop a stavba bazéna"
---

### Východisko

Zemné práce Krivošík je rodinná firma z Veľkých Kostolian. Robí zemné a výkopové práce, terénne úpravy, betónovanie a búranie pre domácnosti, firmy aj obce a cenovú ponuku pripravuje zadarmo. Web jej robím od roku 2021 a stále ho spravujem.

Starý web bežal na hotovej téme s page builderom. Fungoval, no mal tri slabiny: pomalý mobil, žiadny formulár a žiadne meranie dopytov. Ľudia mohli zavolať, ale firma nevedela, koľko návštev k tomu skutočne viedlo.

### Čo sa urobilo

- Vlastná WordPress téma bez page buildera, s tým, čo stránka naozaj používa.
- Formulár vedľa mapy, chránený proti spamu bez otravnej captcha (Cloudflare Turnstile), odosiela sa na firemný e-mail.
- Vlastný karusel recenzií z Google, sekcia O nás s fotkou a číslami a nové poradie sekcií.
- Časté otázky so štruktúrovanými údajmi, nová sitemap, presmerovania starých adries a súbor llms.txt.
- Cookie lišta v dizajne webu a GA4 s udalosťami `generate_lead` a `contact`, takže sa dopyty zo stránky dajú sledovať.
- Kompletná sada ikon webu.

### Výsledok

Porovnanie v Google PageSpeed Insights, 12. 11. 2026, starý web ráno a nový po nasadení:

- výkon na mobile: 79 → 95
- prvé zobrazenie (FCP) na mobile: 3,4 s → 1,0 s
- blokovanie vstupu (TBT) na mobile: 80 ms → 0 ms
- Speed Index na mobile: 6,9 s → 3,0 s
- dostupnosť na mobile: 91 → 99
- SEO a osvedčené postupy: 100 na oboch verziách

Čo sa nezlepšilo: desktop bol už predtým na hornej hranici (97 → 96) a hlavný obsah (LCP) na mobile sa skrátil len z 3,4 s na 2,9 s, stále nad hranicou 2,5 s, ktorú Google považuje za dobrú. Sú to laboratórne čísla; dáta od skutočných návštevníkov doplním, keď ich nazbiera Search Console.
