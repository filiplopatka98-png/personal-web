---
name: "KUKO detský svet"
kind: "Web na mieru · vlastný PHP backend"
year: "2026"
role: "Full-stack Developer"
duration: "4 týždne"
client: "KUKO detský svet"
url: "kukodetskysvet.sk"
accent: accent
order: 8
featured: false
brief: "Web na mieru pre detskú herňu a kaviareň v Piešťanoch — vlastný PHP + MySQL backend s rezerváciou osláv a custom CMS."
metrics:
  - value: "3"
    label: "balíčky osláv"
stack:
  - "PHP"
  - "MySQL"
  - "JavaScript"
  - "PHPMailer"
---

Web na mieru pre detskú herňu a kaviareň v Piešťanoch, postavený bez WordPressu a bez závislosti na externých službách — vlastný backend v PHP 8 a MySQL, s vanilla HTML/CSS/JS frontendom cez PHP šablóny. Jednostránkový dizajn v pastelovej farebnej palete.

Súčasťou je rezervačný systém na detské oslavy (3 balíčky), custom CMS pre majiteľku na úpravu obsahu a e-mailový pipeline cez PHPMailer + SMTP na potvrdenia a cron naplánované pripomienky. Flow rezervácie: formulár → záznam v databáze so stavom „čaká na schválenie" → schválenie adminom → e-maily zákazníkovi aj adminovi → pripomienka pred akciou.
