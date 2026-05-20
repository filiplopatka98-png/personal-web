---
name: "Arcibiskupstvo Prešov"
kind: "Inštitucionálny web · WordPress"
year: "2024"
role: "WordPress Developer"
duration: "2 mesiace"
client: "Gréckokatolícke arcibiskupstvo Prešov"
url: "grkatpo.sk"
accent: accent
order: 3
featured: false
brief: "Oficiálny web Gréckokatolíckeho arcibiskupstva Prešov — informácie o farnostiach, liturgický kalendár, livestreamy a darcovský portál dobrodinec.online."
metrics:
  - value: "3 000+"
    label: "kňazov v databáze"
  - value: "400+"
    label: "farností"
  - value: "5"
    label: "custom integrácií"
process:
  - title: "Analýza"
    duration: "1 týždeň"
    desc: "Audit existujúceho webu, mapping content štruktúry (farnosti, schematizmus, kalendár), zber API špecifikácií pre livestream a dobrodinec.online."
  - title: "Design"
    duration: "2 týždne"
    desc: "Vizuálny návrh inštitucionálneho webu, hero sekcia s livestream feedom + dobrodinec.online integráciou, redakčné šablóny pre správy a udalosti."
  - title: "Build"
    duration: "3 týždne"
    desc: "Custom WordPress theme, ACF Pro pre kňazov a farnosti, integrácia 3 API (livestream, externý kalendár, dobrodinec.online)."
  - title: "Komplexné admin rozhranie"
    duration: "1 týždeň"
    desc: "Custom UI pre správu 3 000+ kňazov a 400+ farností, 2 export skripty pre interné reporty arcibiskupstva."
  - title: "Launch"
    duration: "2 dni"
    desc: "Migrácia obsahu z pôvodného webu, redirecty starých URL, GDPR consent, produkčné nasadenie."
  - title: "Optimalizácia rýchlosti"
    duration: "4 dni"
    desc: "Page caching, image lazy-loading, CDN pre statické assety, optimalizácia DB queries v admin paneli."
stack:
  - "WordPress"
  - "ACF Pro"
  - "Custom theme"
  - "YouTube API"
  - "GDPR consent"
heroCaption: "homepage · livestream + dobrodinec.online"
mobileCaption: "liturgický kalendár na mobile"
secondaryCaption: "schematizmus · 3 000+ kňazov v databáze"
---

Redesign oficiálneho webu Gréckokatolíckeho arcibiskupstva Prešov. Ide o komunikačný kanál pre veriacich, kňazov a záujemcov o činnosť arcibiskupstva — správy z farností, liturgický kalendár, video evangeliár a livestreamy bohoslužieb.

Súčasťou ekosystému je aj darcovský portál **dobrodinec.online**, ktorý je integrovaný v hero sekcii hlavnej stránky. Web kombinuje časté redakčné aktualizácie (správy, akcie) so statickým inštitucionálnym obsahom (schematizmus, metropolita).

Pod kapotou som naprogramoval **3 API napojenia** (livestream feedy, externý kalendár, dobrodinec.online) a **2 custom export skripty** pre databázu kňazov a farností (cez 3 000+ záznamov), ktoré arcibiskupstvo používa pre interné reporty.
