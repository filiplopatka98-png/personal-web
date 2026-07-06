---
title: "Keyboard-only test za 10 minút: postup, ktorý funguje"
date: 2025-09-22
read: 6
tags: ["Accessibility", "Process"]
excerpt: "10-minútový rýchly test pred spustením. Tab, Enter, Escape, Space — odhalí 70 % problémov s prístupnosťou bez špeciálnych nástrojov a bez certifikácie."
featured: false
---

Pred každým spustením strávim 10 minút testovaním webu len cez klávesnicu. Žiadny čítač obrazovky, žiadny axe DevTools, len Tab, Shift+Tab, Enter, Space, Escape a šípky. Odhalí to približne 70 % problémov s prístupnosťou a stojí ťa to menej kávy, ako trvá plný audit. Berem to ako prvý krok pravidla [WCAG AA na malom webe: 80 % efektu za 20 % práce](/blog/wcag-aa-80-20/).

Toto je checklist, na ktorý zabudneš, ak ho nemáš pred očami.

## Príprava: 30 sekúnd

- Otvor stránku v Chrome alebo Firefoxe.
- Klikni do adresného riadka a stlač Tab. Fokus by sa mal presunúť na prvý zaostriteľný prvok na stránke.
- Ak nikde nevidíš fokusový rámik (modrý outline), máš problém už pred štartom. Najprv ho oprav (hľadaj `outline: none` v CSS). Potom pokračuj.

## Test 1: Tab cez celú stránku (2 min)

Stláčaj Tab opakovane od začiatku po koniec. Sleduj tri veci:

1. **Vidno fokus?** Každý zaostriteľný prvok musí mať jasne viditeľný indikátor fokusu. Modrý outline od prehliadača stačí, ale ak ho prepíšeš cez `outline: none` bez náhrady, je to fail.
2. **Logické poradie?** Fokus sa pohybuje zľava doprava, zhora nadol. Ak skáče chaoticky (napr. z hlavičky dole do pätičky a späť), poradie v DOM-e je rozhádzané oproti vizuálnemu rozloženiu.
3. **Žiadny „fokusový zombie“?** Niektoré prvky (napr. položky dropdownu) sú v DOM-e, ale skryté cez `display: none` alebo `visibility: hidden` — tie nemajú byť zaostriteľné. Ak Tab skočí na „neviditeľný“ prvok, máš ho skrytý zlým spôsobom (`opacity: 0` alebo len `visibility: hidden`).

Pri probléme: `tabindex="-1"` na prvky, ktoré nemajú byť zaostriteľné, alebo ich skry cez `display: none` či atribút `hidden`.

## Test 2: Skip-link (15 sec)

Obnov stránku. Stlač Tab raz. Mal by sa zobraziť skip-link „Preskočiť na obsah“ alebo podobný.

Ak skip-link **chýba**, pridaj ho. Používateľ klávesnice inak musí preklikať cez 30 navigačných odkazov, aby sa dostal k obsahu.

```html
<a href="#main" class="skip-link">Preskočiť na obsah</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  background: #0066cc;
  color: white;
  padding: 8px 16px;
}
.skip-link:focus { top: 0; }
```

## Test 3: Menu / dropdown (2 min)

Nájdi navigáciu s dropdownom. Tabni naň, stlač Enter alebo Space.

- **Otvorí sa?** Ak nie, máš `<div onclick>` namiesto `<button>`. Riešenie: použi sémantický prvok `<button>`.
- **Šípky, alebo Tab?** Bežný vzor: Tab pokračuje na ďalšiu položku hlavnej navigácie, šípky sa pohybujú v rámci submenu. Ak používaš [vzor APG menu](https://www.w3.org/WAI/ARIA/apg/patterns/menu/), Tab submenu zatvorí a presunie fokus mimo neho.
- **Zavrie Escape?** V dropdowne stlač Escape — má sa zavrieť a fokus má skočiť späť na spúšťacie tlačidlo.

Najčastejší fail: dropdown sa otvorí pri prejdení myšou (mouseenter), ale klávesnica ho nikdy neotvorí. Riešenie: dropdown musia otvárať aj `focus`/`focus-within`.

```css
.dropdown:hover .submenu,
.dropdown:focus-within .submenu {
  display: block;
}
```

## Test 4: Formulár (3 min)

Nájdi kontaktný, objednávkový alebo prihlasovací formulár. Tabni do prvého poľa.

1. **Tab cez všetky polia** v poradí, v akom sú vizuálne. Žiadne preskočenia.
2. **Odoslanie** — stlač Enter v ľubovoľnom textovom poli. Formulár sa má odoslať (predvolené správanie prehliadača). Ak sa neodošle, máš `<button type="submit">` prerobený na obyčajný `<button>` (predvolený typ je `submit`, ale ak si ho zmenil na `type="button"`, Enter v poli odoslanie nespustí).
3. **Vidno chyby validácie?** Odošli prázdny formulár alebo neplatný e-mail. Chybová hláška musí byť:
   - Vizuálne viditeľná (nie len červený rámik — to je podmienené farbou, fail pre slabozrakých; WCAG 1.4.1 Použitie farby)
   - Programovo previazaná s poľom cez `aria-describedby` a `aria-invalid="true"`
   - Oznámená čítačom obrazovky cez `aria-live="polite"` na kontajneri s chybou (alebo `role="alert"`)

Príklad správneho značkovania chyby:

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  required
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" role="alert">
  Email je povinný.
</p>
```

## Test 5: Modal / dialog (2 min)

Otvor akýkoľvek modal (cookie lištu, prihlásenie, obrázkový lightbox).

1. **Skočí fokus dovnútra modalu?** Ak nie, používateľ nevie, kde je. Riešenie: programovo `dialogEl.focus()` alebo fokus na prvý zaostriteľný prvok.
2. **Je fokus uväznený?** Stláčaj Tab, Tab, Tab... fokus sa má pohybovať len v rámci modalu. Ak vyskočí na pozadie, chýba pasca na fokus (focus trap).
3. **Zavrie Escape?** Stlač Escape — modal sa má zavrieť.
4. **Vráti sa fokus?** Po zavretí má fokus skočiť späť na tlačidlo, ktoré modal otvorilo.

Ak sa všetky štyri body splnia, máš dialóg implementovaný správne. Inak prejdi na natívny prvok `<dialog>` alebo dopíš správu fokusu ([písal som o tom tu](/blog/focus-management-dialog)).

## Test 6: macOS VoiceOver basic (bonus, 30 sec)

Ak si na Macu: Cmd+F5 zapne VoiceOver. To isté Cmd+F5 ho hneď aj vypne (na tento test ho nepotrebuješ dlho).

Pred vypnutím skús:

- VO+A — prečítať stránku od začiatku
- VO+šípka doprava — ďalší prvok

Ak ti VoiceOver číta nezmysly („graphic, image-cropped-2.jpg“) namiesto popisných alt textov, máš problém s atribútmi `alt` (o generovaní [alt textov cez AI a ich SEO rizikách](/blog/ai-alt-text-seo/) som písal samostatne).

## Cookie banner anti-pattern

Špeciálny prípad. Cookie lišta často:

- Otvorí sa pred obsahom, ale fokus zostane v pätičke
- Tab z nej ide do hlavného obsahu (chýba pasca na fokus)
- Bez kliknutia na „Accept“ sa nedá pokračovať (vynútená voľba — problém z pohľadu WCAG)

Ak cookie lišta blokuje stránku, **musí** mať pascu na fokus a zatváranie cez Escape. Inak je klávesnicou nepoužiteľná.

## Reálne čísla z mojich projektov

Z 12 webov, ktoré som touto 10-minútovou metódou testoval pred spustením:

- Priemerne nájdených problémov: **8 na web**
- Z toho kritických (úplne blokujú používateľa klávesnice): **2 na web**
- Času na opravu (priemerne): **45 min**

Ak by sa to zachytilo až po spustení v Lighthouse audite alebo v spätnej väzbe od používateľa, čas na opravu je 3× dlhší — kvôli prepínaniu kontextu späť na projekt.

## Checklist na vytlačenie

```
[ ] Tab cez celú stránku — fokus viditeľný všade?
[ ] Tab cez celú stránku — logické poradie?
[ ] Skip-link funguje pri prvom Tabe?
[ ] Menu: Enter/Space otvorí, Tab/šípky navigujú, Escape zavrie
[ ] Formulár: Tab cez polia, Enter odošle, chyby viditeľné + oznámené
[ ] Modal: fokus dnu, Tab uväznený, Escape zavrie, fokus sa vráti
[ ] Cookie lišta má pascu na fokus (ak blokuje)
[ ] Základná kontrola cez VoiceOver (Cmd+F5)
```

## TL;DR

10 minút, žiadne nástroje navyše. Tab cez stránku, otestuj menu, formuláre a modaly na Tab/Enter/Escape, pascu na fokus a jeho návrat. Odhalí to 70 % problémov s prístupnosťou, ktoré by inak našiel až axe-core alebo (horšie) reálny používateľ. Pripni si checklist na monitor.
