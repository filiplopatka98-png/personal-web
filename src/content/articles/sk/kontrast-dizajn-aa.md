---
title: "Kontrast a dizajn: ako splniť WCAG AA bez toho, aby web zošedivel"
date: 2027-02-09
read: 8
tags: ["Accessibility", "Design"]
excerpt: "Kontrast AA sa dá splniť bez sivej nudy. Reálne prahy, ktoré platia, kde WCAG 2 klame vnímanie a ako počítať farby priamo v CSS."
featured: false
---

Kontrast je najčastejší nález v každom accessibility audite, aký som kedy videl. A zároveň ten, ktorý dizajnéri neznášajú najviac — pretože „splniť AA" v ich hlavách znamená „urob to škaredé a sivé". Nie je to pravda. Dá sa splniť WCAG AA a mať pekný, značkový web súčasne. Len treba vedieť, kde presne sú prahy a kde ťa štandard vodí za nos.

## Čísla, ktoré musíš poznať naspamäť

WCAG 2.2 na úrovni AA má tri kontrastové kritériá a stačí poznať dve čísla:

- **Bežný text** (kritérium 1.4.3): minimálne **4,5:1** voči pozadiu.
- **Veľký text** (18 pt / 24 px, alebo 14 pt / 18,66 px tučný): stačí **3:1**.
- **Netextové prvky** — okraje inputov, ikony, stavy komponentov, grafy (kritérium 1.4.11): minimálne **3:1**.

Dôležitý detail, ktorý veľa ľudí prekvapí: tieto čísla sa **medzi WCAG 2.1 a 2.2 nezmenili**. Kto sa učil kontrast pred piatimi rokmi, nič nezmeškal. A prahy sú tvrdé — 4,49:1 padá rovnako ako 2:1. Žiadne zaokrúhľovanie nahor.

Úroveň AAA je prísnejšia (7:1 pre bežný text, 4,5:1 pre veľký), ale tú na komerčnom webe pre malú firmu neženiem. AA je právne relevantná latka aj v kontexte European Accessibility Act a je úplne dostatočná.

## Prečo „veľký text = 3:1" mení celý dizajn

Toto je páka, ktorú dizajnéri prehliadajú. Nadpisy, hero claimy, veľké čísla v štatistikách — všetko nad 24 px (alebo 18,66 px tučné) spadá do miernejšieho prahu 3:1. To ti otvára celú paletu farieb, ktoré by v bežnom texte neprešli.

Značková zelená alebo oranžová, ktorá na `16px` odsek vyzerá ako `4,5:1` fail, môže byť úplne v poriadku ako veľký nadpis. Praktický dôsledok: **nemusíš mať jednu farbu textu pre celý web.** Telo drž konzervatívne a bezpečne, akcenty si dovoľ vo veľkých rozmeroch.

Overuj to konkrétne. Ja používam [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — je zadarmo, zadáš dva hex kódy a rovno ti ukáže pass/fail pre bežný aj veľký text, aj pre netextové 3:1. Keď farba padne, ponúkne najbližší odtieň, ktorý prejde. To je presne ten workflow, ktorý zachová brand a zároveň dotiahne kontrast.

## Kde ťa WCAG 2 vodí za nos

Tu treba byť úprimný. Kontrastový vzorec WCAG 2 je založený na relatívnej luminancii a má dve slabé miesta, ktoré v praxi bežne vídam:

**Je symetrický.** Prehodíš text a pozadie a dostaneš rovnaké číslo. Lenže ľudské oko nie je symetrické — tmavý text na svetlom pozadí vnímame inak než svetlý text na tmavom. WCAG 2 to nerozlišuje.

**Ignoruje hrúbku a veľkosť písma** (okrem hrubého prahu veľký/bežný). Tenké písmo na hranici 4,5:1 je reálne horšie čitateľné než tučné pri rovnakom čísle, no vzorec o tom nevie.

Preto vzniká APCA (Advanced Perceptual Contrast Algorithm) — perceptuálny model, ktorý ráta polaritu, veľkosť aj hrúbku. Ale pozor, a toto je časté nedorozumenie v článkoch na internete: **APCA nie je „WCAG 3" a nie je normatívny.** WCAG 3.0 je v roku 2026 stále working draft a working group vyňala APCA obsah ako exploratívny. Nikto ti dnes nemôže poctivo povedať, že APCA je oficiálna kontrastová metóda WCAG 3.

Praktický záver: **audituj a garantuj podľa WCAG 2 (4,5:1 / 3:1), pretože to je záväzná latka.** APCA používaj ako druhý názor, keď ti niečo „prejde" na WCAG 2, ale očividne sa zle číta — typicky svetlý text na strednom farebnom pozadí.

## Počítaj farby, nehádaj ich

Najčastejšia príčina kontrastových failov, ktorú vídam, je ručné picovanie odtieňov v dizajnovom nástroji a kopírovanie hex kódov. Moderné CSS ti to vie zobrať z rúk.

`oklch()` je perceptuálne rovnomerný farebný priestor a v roku 2026 ho podporujú všetky evergreen prehliadače (Chrome/Edge 111+, Safari 15.4+, Firefox 113+) — teda drvivá väčšina reálnej návštevnosti. Výhoda pri kontraste: keď meníš `L` (lightness), meníš vnímaný jas predvídateľne, na rozdiel od HSL.

Škálu značkovej farby vieš odvodiť relatívnou syntaxou z jedného zdroja:

```css
:root {
  --brand: oklch(0.62 0.19 264); /* zdrojová značková farba */

  /* svetlejšie/tmavšie varianty odvodené z jednej hodnoty */
  --brand-strong: oklch(from var(--brand) 0.42 c h); /* tmavší → vyšší kontrast na bielej */
  --brand-soft:   oklch(from var(--brand) 0.92 0.04 h); /* pozadie badge/chipu */
}
```

Keď potrebuješ text, ktorý sa vždy trafí do čiernej alebo bielej podľa pozadia, existuje `contrast-color()`. Vezme farbu a vráti buď `white`, alebo `black` — podľa toho, čo má vyšší kontrast:

```css
.badge {
  background: var(--brand);
  color: contrast-color(var(--brand));
}
```

Má to však dva háčiky, ktoré musíš vedieť. Prvý: podľa MDN je `contrast-color()` **Baseline Newly Available až od apríla 2026** — na starších prehliadačoch nefunguje, takže vždy definuj fallback `color`. Druhý, dôležitejší: garantuje len WCAG AA (4,5:1) a pri **stredných tónoch** (napr. sýta kráľovská modrá) môže vrátiť čiernu aj bielu tak, že ani jedna nie je poriadne čitateľná. Preto ho používaj na svetlé alebo tmavé pozadia, nie na stredné. Pri strednom tóne radšej sáhni po výraznejšom vlastnom odtieni a over ho ručne.

## Nezabudni na 1.4.11 a 1.4.1 — tie padajú tichšie

Textový kontrast každý testuje. Na čo sa zabúda:

**Netextový kontrast (1.4.11).** Okraj input poľa `1px` v svetlosivej voči bielej je klasický fail — potrebuje 3:1 voči susednej farbe. To isté platí pre ikony nesúce význam, stavy toggle prepínačov či dátové rady v grafe. Placeholder text mimochodom pod 1.4.3 spadá tiež, takže ten bledosivý placeholder, čo všetci milujú, býva pod prahom.

**Nespoliehaj sa len na farbu (1.4.1, úroveň A).** Odkaz v texte odlíšený **iba** farbou je zlyhanie — potrebuje ešte podčiarknutie, tučnosť alebo iný nefarebný signál. Rovnako chybové hlásenie formulára nesmie byť len červené; potrebuje ikonu alebo text. Toto je najlacnejšia oprava vôbec a zároveň najčastejšie prehliadaná.

```css
/* odkaz v odseku: nie iba farba, ale aj podčiarknutie */
.prose a {
  color: var(--brand-strong);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
```

Ako to celé vsadiť do širšieho minima pre malý web som rozpísal v článku [WCAG AA na malom webe: 80 % efekt za 20 % práce](/blog/wcag-aa-80-20/). Ak riešiš špeciálne formuláre, kde kontrast a farebné stavy najčastejšie padajú, pozri [prístupné formuláre a chyby, ktoré robí 90 % webov](/blog/pristupne-formulare/). A keby si chcel celý web preklepnúť klávesnicou vrátane viditeľného focusu (ktorý má tiež svoj kontrastový prah), mám [keyboard-only test za 10 minút](/blog/keyboard-only-test/).

## Ako to robím ja

Poradie, ktoré funguje vo väčšine projektov:

1. Definuj **jednu zdrojovú značkovú farbu** v `oklch` a odvoď z nej škálu relatívnou syntaxou. Nekopíruj hex kódy ručne.
2. Telo textu drž bezpečne nad 4,5:1. Akcenty a značkové farby si dovoľ vo **veľkých rozmeroch** (3:1).
3. Prejdi **netextové prvky** — okraje inputov, ikony, focus ring, grafy — na 3:1.
4. Skontroluj **1.4.1** — nikde nesmie byť informácia len farbou.
5. Over reálne hodnoty vo WebAIM checkeri. Pri sporných prípadoch pridaj APCA ako druhý názor.

Kontrast nie je nepriateľ dizajnu. Je to obmedzenie ako každé iné — a dobrý dizajn vzniká práve v obmedzeniach. Sivá nuda vzniká len vtedy, keď na kontrast prídeš až na konci a plošne stlmíš všetko. Keď s ním počítaš od začiatku a vieš, kde sú prahy, nikto nespozná, že si niečo „musel".
