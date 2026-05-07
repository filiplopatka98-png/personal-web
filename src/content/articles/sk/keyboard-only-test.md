---
title: "Keyboard-only test za 10 minút: postup, ktorý funguje"
date: 2025-09-22
read: 6
tags: ["Accessibility", "Process"]
excerpt: "10-minútový smoke test pred launch-om. Tab, Enter, Escape, Space — odhalí 70 % A11y issues bez špeciálnych nástrojov a bez certifikácie."
featured: false
---

Pred každým launch-om strávim 10 minút testovaním webu len cez klávesnicu. Žiadny screen reader, žiadny axe DevTools, len Tab, Shift+Tab, Enter, Space, Escape a šípky. Odhalí ~70 % A11y issues a stojí ťa to menej kávy ako trvá full audit.

Toto je checklist, ktorý zabudneš ak ho nemáš pred očami.

## Príprava: 30 sekúnd

- Otvor stránku v Chrome alebo Firefox.
- Klikni do url baru a stlač Tab. Focus by sa mal pohnúť na prvý focusable element na stránke.
- Ak nevidíš focus ring (modrý outline) na ničom — máš problém už pred štartom. Najprv oprav (`outline: none` v CSS). Potom pokračuj.

## Test 1: Tab cez celú stránku (2 min)

Stlač Tab opakovane od začiatku po koniec. Sleduj 3 veci:

1. **Focus visible?** Každý focusable element musí mať jasne viditeľný focus indicator. Modrý outline od browser-a stačí, ale ak ho prepíšeš `outline: none` bez náhrady, fail.
2. **Logical order?** Focus sa pohybuje zľava-doprava, zhora-dolu. Ak skáče chaoticky (napr. z headera dole do paticky a späť), DOM order je rozhádzaný oproti vizuálnemu layoutu.
3. **Žiadny "focus zombie"?** Niektoré elementy (napr. dropdown items) sú v DOM-e, ale skryté cez `display: none` alebo `visibility: hidden` — tie nemajú byť focusable. Ak Tab skočí na "neviditeľný" element, máš ho skrytý zlým spôsobom (`opacity: 0` alebo `visibility: hidden` bez `display: none`).

Pri probleme: `tabindex="-1"` na elementy ktoré nemajú byť focusable, alebo skry ich cez `display: none`/`hidden` attribute.

## Test 2: Skip-link (15 sec)

Refresh stránku. Stlač Tab raz. Mal by sa zobraziť skip-link "Preskočiť na obsah" alebo podobný.

Ak skip-link **nie je**, pridaj ho. Klávesnicový user inak musí prekliknúť cez 30 nav linkov, aby sa dostal k obsahu.

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

Najdi navigáciu s dropdown-om. Tabni naň, stlač Enter alebo Space.

- **Otvorí sa?** Ak nie, máš `<div onclick>` namiesto `<button>`. Fix: použi semantic `<button>` element.
- **Šípky alebo Tab?** Mainstream pattern: Tab pokračuje na ďalší main nav item, šípky pohybujú v rámci submenu. Ak používaš pattern z [APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/), Tab zatvára submenu.
- **Escape close?** V dropdown stlač Escape — má sa zavrieť a focus má skočiť späť na trigger button.

Najčastejší fail: dropdown sa otvorí na hover (mouseenter), ale klávesnica ho nikdy neotvorí. Riešenie: aj `focus`/`focus-within` musia otvárať dropdown.

```css
.dropdown:hover .submenu,
.dropdown:focus-within .submenu {
  display: block;
}
```

## Test 4: Formulár (3 min)

Najdi kontaktný/checkout/login formulár. Tabni do prvého poľa.

1. **Tab cez všetky polia** v poradí, v ktorom sú vizuálne. Žiadne preskočenia.
2. **Submit** — stlač Enter v ľubovoľnom textovom poli. Formulár sa má submit-núť (default browser behaviour). Ak nesubmituje, máš `<button type="submit">` pretvorený na `<button>` (default type je submit, ale ak si ho zmenil na `type="button"`, Enter v poli neurobí submit).
3. **Validation errors visible?** Submit s prázdnym formulárom alebo invalid emailom. Error message musí byť:
   - Vizuálne viditeľný (nie len červený border — to je farebne podmienené, fail pre slabozrakých)
   - Programaticky asociovaný s poľom cez `aria-describedby` alebo `aria-invalid="true"`
   - Announced for screen readers cez `aria-live="polite"` na error container

Príklad správneho error markup:

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

Otvor akýkoľvek modal (cookie banner, login, image lightbox).

1. **Focus skočí dovnútra modal-u?** Ak nie, user nevie kde je. Fix: programovo `dialogEl.focus()` alebo focus na first focusable.
2. **Tab trapped?** Stlač Tab, Tab, Tab... focus sa má pohybovať len v rámci modal-u. Ak vyskočí na pozadie, focus trap chýba.
3. **Escape close?** Stlač Escape — modal sa má zavrieť.
4. **Focus restore?** Po zavretí má focus skočiť späť na tlačidlo, ktoré modal otvorilo.

Ak sa všetky 4 splnia, máš správne implementovaný dialog. Inak prejdi na native `<dialog>` element alebo dopiš focus management ([písal som o tom tu](/blog/focus-management-dialog)).

## Test 6: macOS VoiceOver basic (bonus, 30 sec)

Ak si na Mac-u: Cmd+F5 zapne VoiceOver. Hneď ho ukončí Cmd+F5 znova (test ho nepotrebuje).

Pred ukončením skús:

- VO+A — read page from top
- VO+→ — next element

Ak ti VoiceOver číta nezmysly ("graphic, image-cropped-2.jpg") namiesto popisných alt textov, máš problém s alt atribútmi.

## Cookie banner anti-pattern

Špeciálny case. Cookie banner často:

- Otvorí sa pred contentom, ale focus zostane v paticke
- Tab z neho ide do main contentu (chýba focus trap)
- Bez click-u na "Accept" sa nedá pokračovať (forced choice — fail pre WCAG)

Ak cookie banner blokuje stránku, **musí** mať focus trap a Escape close. Inak je nepoužiteľný klávesnicou.

## Real numbers z mojich projektov

Z 12 webov, ktoré som testoval cez túto 10-min metódu pred launch-om:

- Priemerne nájdených issues: **8 na web**
- Z toho critical (kompletne block-ujú klávesnicového usera): **2 na web**
- Času na fix (priemerne): **45 min**

Ak by sa to zachytilo až po launch-i v Lighthouse audit-e alebo v UX feedback-u od user-a, čas na fix je 3× — kvôli kontexte switch-ingu späť na projekt.

## Checklist na vytlačenie

```
[ ] Tab cez celú stránku — focus visible everywhere?
[ ] Tab cez celú stránku — logical order?
[ ] Skip-link funguje pri prvom Tab-e?
[ ] Menu open Enter/Space, navigate Tab/šípky, Escape close
[ ] Formulár: Tab cez polia, Enter submit, errors visible + announced
[ ] Modal: focus inside, Tab trapped, Escape close, focus restore
[ ] Cookie banner má focus trap (ak blokuje)
[ ] VoiceOver basic check (Cmd+F5)
```

## TL;DR

10 minút, žiadne nástroje navyše. Tab cez stránku, otestuj menu/forms/modals na Tab/Enter/Escape, focus trap a restore. Odhalí 70 % A11y issues, ktoré by inak našiel až axe-core alebo (horšie) reálny user. Pripni si checklist na monitor.
