---
name: "ntmcleaning.sk"
kind: "Nový web na mieru · WordPress"
year: "2026"
role: "WordPress Developer"
duration: "2 týždne"
client: "NTM Cleaning"
url: "ntmcleaning.sk"
accent: accent2
order: 6
featured: false
brief: "Nový web pre firmu, ktorá tepuje čalúnenie a čistí kožu v autách priamo u zákazníka. Mobilný výkon z 60 na 99 bodov, hlavný obsah za 1,7 s namiesto 11,4 s."
metrics:
  - value: "60 → 99"
    label: "výkon na mobile (PageSpeed)"
  - value: "11,4 → 1,7 s"
    label: "hlavný obsah (LCP) na mobile"
  - value: "100"
    label: "dostupnosť, SEO aj postupy"
stack:
  - "WordPress"
  - "Vlastná téma"
  - "Yoast SEO"
  - "Contact Form 7"
  - "Cloudflare Turnstile"
  - "GA4"
heroCaption: "homepage · telefón a cenová ponuka na dosah"
mobileCaption: "úvod na mobile"
secondaryCaption: "služby, cenník a referencie na jednej stránke"
---

NTM Cleaning robí hĺbkové tepovanie sedačiek a kobercov, čistenie kože a autodetailing interiéru priamo u zákazníka v Trnavskom, Bratislavskom, Trenčianskom a Nitrianskom kraji. Starý web bežal na hotovej téme s page builderom Elementor a na mobile sa hlavný obsah zobrazil po vyše jedenástich sekundách.

Nový web je postavený na vlastnej WordPress téme bez buildera. Služby, cenník, realizácie, počítadlá, časté otázky a kontakt sú na jednej stránke v logickom poradí. Podstránky služieb, ktoré len opakovali ten istý text, odpadli a staré adresy sa presmerovali, aby nikto nenarazil na chybu 404. Telefón a nezáväzná cenová ponuka sú stále na dosah, formulár chráni Cloudflare Turnstile. Údaje o firme pre Google, sitemap, Search Console a súbor llms.txt boli nastavené od prvého dňa; odoslaný formulár sa meria v GA4.

Obe verzie som 12. 11. 2026 meral v Google PageSpeed Insights. Starý web už verejne nebeží, preto som ho spustil zo zálohy na dočasnej adrese s pôvodnou databázou, bez zásahov do obsahu a s vypnutým indexovaním, a meral som ho trikrát (uvádzam medián; jeden výkyv na 29,8 s som do porovnania nezahrnul). Na mobile sa výkon zlepšil zo 60 na 99 bodov, hlavný obsah z 11,4 na 1,7 s a poskakovanie obsahu z 0,132 na 0. Na desktope vyšlo 100 bodov oproti 72. Dostupnosť stúpla zo 85 na 100 a nový web má 100 bodov aj v SEO a osvedčených postupoch. Sú to laboratórne čísla; dáta od skutočných návštevníkov prídu zo Search Console.

Pri kontrole po spustení sa ukázalo, že favicon existoval len ako WebP (iOS ho ako ikonu nepoužije) a chýbal manifest. Doplnil som všetky typy ikon: ICO, PNG v troch veľkostiach, apple-touch-icon a site.webmanifest.

„Môj web je od základov prekopaný, prehľadný a moderný. Som nadšený z Filipovej šikovnosti, rýchlosti, trpezlivosti a hlavne ľudskosti.“ — Nikolas Kollár, NTM Cleaning (recenzia na Google)

<!-- Výsledky doplniť po 30 a 90 dňoch (7. 12. 2026, 3. 2. 2027): dopyty z formulára a z telefónu, zobrazenia a kliky zo Search Console. -->
