---
title: "Prístupné formuláre: chyby, ktoré robí 90 % webov"
date: 2027-02-04
read: 8
tags: ["Accessibility"]
excerpt: "Placeholder namiesto labelu, chyby len červenou farbou, chýbajúci autocomplete. Praktický návod, ako spraviť formulár, ktorý zvládne klávesnica aj čítač obrazovky."
featured: false
---

Formulár je miesto, kde web buď zarobí, alebo stratí. A pritom je to najčastejšie zanedbaná časť z pohľadu prístupnosti. Nie preto, že by to bolo ťažké — ale preto, že to na prvý pohľad „funguje“. Vyzerá to dobre, myšou sa to vyplní, dizajnér je spokojný. Až kým sa niekto nepokúsi vyplniť to klávesnicou alebo s čítačom obrazovky.

Za roky vídam stále tú istú hŕstku chýb dokola. Väčšina z nich sa dá opraviť za pár minút a pritom robia formulár nepoužiteľným pre reálnych ľudí. Tu je zoznam tých, čo sa objavia takmer všade, aj s tým, ako ich opraviť poriadne.

## 1. Placeholder namiesto labelu

Najčastejší hriech. Dizajnér chce čistý formulár bez „zbytočných“ popiskov, tak sa text presunie do `placeholder` atribútu. Vyzerá to minimalisticky. A je to nefunkčné hneď v troch smeroch.

Placeholder zmizne, keď začneš písať — používateľ tak stratí referenciu, čo do poľa vlastne patrí. Pri chybe validácie sa musíš vrátiť a hádať. Kontrast placeholder textu býva zámerne nízky (svetlosivá), takže padá na WCAG kritériu kontrastu. A väčšina čítačov obrazovky placeholder nepovažuje za spoľahlivú náhradu labelu.

WCAG 2.2 (od 5. októbra 2023 oficiálny W3C štandard) to rieši kritériom **3.3.2 Labels or Instructions** — každé pole, ktoré zbiera vstup od používateľa, musí mať viditeľný, programovo previazaný popisok. Placeholder nie je label. Bodka.

```html
<!-- Zle: label neexistuje, len placeholder -->
<input type="email" placeholder="Váš email">

<!-- Správne: viditeľný label previazaný cez for/id -->
<label for="email">Email</label>
<input type="email" id="email" name="email" autocomplete="email">
```

Ak dizajn naozaj potrebuje „plávajúci label“ (floating label), nech je stále reálny `<label>` v DOM-e — len ho CSS-kom vizuálne posunieš nad pole. Nikdy nenahrádzaj label placeholderom.

## 2. Chyby oznámené len farbou

Odošleš formulár, pole sa orámuje červenou a je hotovo. Lenže červený rámik je informácia nesená **výlučne farbou** — a to je porušenie WCAG **1.4.1 Use of Color**. Farboslepý používateľ (a to je zhruba každý dvanásty muž) ten rozdiel nemusí vidieť. A čítač obrazovky farbu nečíta vôbec.

Chyba musí byť oznámená troma nezávislými kanálmi naraz:

1. **Textom** — konkrétna hláška, nie len rámik. „Zadajte platný email“ namiesto červenej bez slov.
2. **Programovo previazaná s poľom** — cez `aria-describedby` a `aria-invalid="true"`, aby ju čítač prečítal hneď pri fokuse na pole.
3. **Oznámená pri odoslaní** — cez `role="alert"` alebo `aria-live`, aby o nej používateľ vedel, aj keď zrovna nie je na tom poli.

```html
<label for="email">Email</label>
<input
  type="email"
  id="email"
  name="email"
  autocomplete="email"
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" role="alert">Zadajte platný email, napr. meno@firma.sk.</p>
```

Malý, ale dôležitý detail: `aria-invalid="true"` daj na pole len vtedy, keď chyba reálne existuje. Neposielaj ho do DOM-u natvrdo pri načítaní — inak čítač oznámi ako chybné aj pole, do ktorého používateľ ešte ani neklikol.

## 3. Chýbajúci autocomplete

Toto vídam aj na inak slušne spravených weboch. Polia na meno, email, adresu či telefón bez atribútu `autocomplete`. Prehliadač ich potom nevie predvyplniť a používateľ musí ručne vyťukať to isté, čo má uložené v profile.

WCAG **1.3.5 Identify Input Purpose** (úroveň AA) priamo požaduje, aby účel bežných polí bol programovo určiteľný — a `autocomplete` je presne ten mechanizmus. HTML štandard definuje pevnú sadu tokenov (je ich vyše päťdesiat), takže nič nevymýšľaš, len použiješ ten správny:

```html
<label for="fname">Meno</label>
<input id="fname" name="fname" autocomplete="given-name">

<label for="lname">Priezvisko</label>
<input id="lname" name="lname" autocomplete="family-name">

<label for="tel">Telefón</label>
<input id="tel" type="tel" name="tel" autocomplete="tel">

<label for="street">Ulica a číslo</label>
<input id="street" name="street" autocomplete="street-address">

<label for="zip">PSČ</label>
<input id="zip" name="zip" autocomplete="postal-code" inputmode="numeric">
```

Bonus, ktorý ocenia všetci, nielen ľudia so znevýhodnením: pre mobil pridaj `inputmode` (`numeric`, `tel`, `email`), aby sa vyvolala správna klávesnica. A pre číselné kódy nezabudni, že `type="number"` na PSČ či telefón je pasca — orezáva vedúce nuly a rieši šípky navyše. Na kódy použi `type="text"` s `inputmode="numeric"`.

Ak staviaš viackrokový checkout, tá istá logika sa dotýka aj nového kritéria **3.3.7 Redundant Entry** (WCAG 2.2, úroveň A): údaj, ktorý používateľ raz zadal v rámci jedného procesu, od neho nesmieš pýtať znova. Buď ho predvyplň, alebo daj možnosť „rovnaká ako fakturačná“. Pri optimalizácii checkoutu to ide ruka v ruke s [deviatimi mikroúpravami z reálneho auditu](/blog/checkout-konvertuje-9-uprav/).

## 4. Skupiny bez `<fieldset>` a `<legend>`

Rádiové tlačidlá a skupiny checkboxov majú spoločnú otázku — napríklad „Spôsob dopravy“. Ak túto otázku nezabalíš do `<fieldset>` s `<legend>`, čítač obrazovky prečíta len jednotlivé možnosti („Kuriér“, „Odberné miesto“) bez kontextu, čoho sa vlastne týkajú.

```html
<fieldset>
  <legend>Spôsob dopravy</legend>

  <label>
    <input type="radio" name="shipping" value="courier"> Kuriér
  </label>
  <label>
    <input type="radio" name="shipping" value="pickup"> Odberné miesto
  </label>
</fieldset>
```

Toto je päť riadkov práce, ktoré zmenia „prečítaj mi náhodné slová“ na „vyber si spôsob dopravy“. Napriek tomu sa `<fieldset>` vo formulároch takmer nevidí.

## 5. Príliš malé a natlačené ovládacie prvky

WCAG 2.2 pridala kritérium **2.5.8 Target Size (Minimum)** (úroveň AA): interaktívne ciele majú mať aspoň 24 × 24 CSS pixelov, alebo okolo seba dostatočný odstup. Malé checkboxy natlačené tesne pod sebou, drobné „×“ na zatvorenie, tlačidlá vysoké 20 pixelov — to všetko je problém pre ľudí s obmedzenou motorikou aj pre bežného používateľa na mobile s palcom.

Nemusíš zväčšovať samotný vizuál — stačí zväčšiť klikaciu plochu cez `padding` alebo neviditeľnú vrstvu. Pri labeloch checkboxov je fajn spraviť klikateľný celý label, nielen štvorček (čo `<label>` obalenie z bodu 4 rieši automaticky).

## 6. Zrušený fokusový rámik

Nie je to čisto formulárová chyba, ale vo formulároch bolí najviac. Niekto dá do CSS `outline: none`, lebo modrý rámik od prehliadača „kazí dizajn“, a už ho nikdy nenahradí. Používateľ klávesnice potom pri tabovaní netuší, v ktorom poli je.

```css
/* Nikdy takto samotné: */
:focus { outline: none; }

/* Ak už prepisuješ default, daj vlastný viditeľný stav: */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

`:focus-visible` je dnes podporovaný vo všetkých moderných prehliadačoch a rieši starý spor „rámik ruší pri klikaní myšou“ — ukáže sa len pri navigácii klávesnicou. Nie je dôvod ho nepoužiť.

## 7. Vlastné komponenty predstierajúce input

`<div>` so `onclick`, ktorý vyzerá ako checkbox. Custom select z `<ul>` a JavaScriptu. Vyzerá to pekne, ale čítač obrazovky vidí len prázdny `<div>` bez roly, bez stavu, bez ovládania klávesnicou.

Moje pravidlo: **najprv skús natívny prvok.** `<input type="checkbox">`, `<select>`, `<input type="date">` — všetky sú dnes štýlovateľné oveľa lepšie než pred pár rokmi a prinášajú prístupnosť zadarmo. K vlastnému komponentu sa uchýľ, len keď natívny naozaj nestačí — a vtedy dodržíš príslušný [APG vzor](https://www.w3.org/WAI/ARIA/apg/) vrátane rolí, stavov a obsluhy klávesnice. To isté platí pre dialógy: [správu fokusu v custom dialógoch](/blog/focus-management-dialog/) som rozobral samostatne.

## Ako to overiť za pár minút

Nemusíš na to audit ani platený nástroj. Otvor formulár a:

- Odlož myš. Prejdi celý formulár len cez **Tab, Shift+Tab, Enter a šípky**. Ak sa niekam nedostaneš alebo nevidíš fokus, máš problém.
- Odošli **prázdny a nesprávne vyplnený** formulár. Sú chyby vidieť ako text? Prečíta ich čítač?
- Skús **predvyplnenie** z prehliadača (uloženej adresy). Ak sa nič nepredvyplní, chýba `autocomplete`.

Detailnejší postup mám v návode [Keyboard-only test za 10 minút](/blog/keyboard-only-test/). A ak riešiš prístupnosť malého webu celkovo, začni pravidlom [WCAG AA za 20 % práce](/blog/wcag-aa-80-20/) — formuláre sú v ňom tá najvýnosnejšia položka.

## Zhrnutie

Prístupný formulár nie je o certifikácii ani o drahom audite. Je to hŕstka návykov: reálny `<label>` namiesto placeholderu, chyby textom a nie len farbou, `autocomplete` na bežné polia, `<fieldset>` na skupiny, dosť veľká klikacia plocha, viditeľný fokus a natívne prvky, kým to ide. Každý jeden bod je pár minút práce — a spolu robia rozdiel medzi formulárom, ktorý „vyzerá dobre“, a formulárom, ktorý naozaj vyplní každý.
