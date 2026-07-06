---
title: "Next.js form actions: koniec API endpointov pre 80 % formulárov"
date: 2026-04-02
read: 7
tags: ["Next.js", "React"]
excerpt: "Server Actions nahrádzajú /api/contact route handlery: 80 riadkov namiesto 250 a progressive enhancement zadarmo. Ale nie sú riešenie na všetko."
featured: false
---

Pred dvoma rokmi som pre kontaktný formulár písal route handler `/api/contact`, validáciu, volanie z klienta, ošetrenie chýb, loading state. Zhruba **250 riadkov** rozhádzaných cez tri až štyri súbory. Dnes to spravím cez Server Action za **80 riadkov v jednom súbore**. A funguje to aj bez JavaScriptu.

## Čo je Server Action

Funkcia označená `"use server"`, ktorá beží na serveri, ale dá sa zavolať priamo z React komponentu (ako event handler). Next.js zariadi serializáciu, prenos aj ošetrenie chýb. Ty napíšeš logiku, on vyrieši inštalatérčinu okolo.

```tsx
// app/contact/actions.ts
"use server";

import { z } from "zod";
import { Resend } from "resend";

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function sendContactMessage(_prev: any, formData: FormData) {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await new Resend(process.env.RESEND_KEY).emails.send({
    from: "web@klient.sk",
    to: "filip@klient.sk",
    subject: `Správa od ${parsed.data.name}`,
    text: parsed.data.message + "\n\n" + parsed.data.email,
  });

  return { ok: true };
}
```

A formulár:

```tsx
// app/contact/page.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactMessage } from "./actions";

export default function ContactPage() {
  const [state, formAction] = useActionState(sendContactMessage, { ok: false });

  if (state.ok) return <p>Ďakujem, ozvem sa do 24 hodín.</p>;

  return (
    <form action={formAction}>
      <input name="name" required />
      {state.errors?.name && <span>{state.errors.name[0]}</span>}
      <input name="email" type="email" required />
      {state.errors?.email && <span>{state.errors.email[0]}</span>}
      <textarea name="message" required />
      {state.errors?.message && <span>{state.errors.message[0]}</span>}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Posielam..." : "Odoslať"}</button>;
}
```

A to je **celý funkčný kontaktný formulár** — validácia, ošetrenie chýb, loading state aj success state. **80 riadkov.**

(Pozn.: pôvodný `useFormState` z `react-dom` je od Reactu 19 nahradený hookom `useActionState` z `react` — tu už používam ten novší.)

## Progressive enhancement zadarmo

Toto je **killer feature**, ktorá sa nedoceňuje. Server Actions fungujú aj **bez JavaScriptu**.

`<form action={sendContactMessage}>` — ak sa JavaScript nestihne načítať alebo je vypnutý, prehliadač spraví štandardný POST submit, server zachytí action, vykoná ju a vráti ti aktualizovanú stránku. **Používateľ odošle formulár aj bez Reactu.**

Bez Server Actions to znamenalo HTML fallback formulár, JS handler a dva rôzne backendové endpointy. Teraz to máš zadarmo.

## Use cases, kde sa Server Actions hodia

Z mojej praxe za posledný rok:

- **Kontaktné / brief / dopytové formuláre** — 90 % web projektov.
- **Prihlásenie na newsletter** — priamy zápis do DB alebo volanie Mailchimp API.
- **Komentáre k blogu** — moderačný príznak, optimistický update.
- **Admin CRUD** — create/update/delete v dashboardoch s nízkou návštevnosťou.
- **Vyhľadávacie formuláre** s action cez `redirect()` — submit → `/search?q=...`.
- **Akcie typu like / save / bookmark** s `useOptimistic`.

Spoločný menovateľ: **interakcia používateľ ↔ vlastný backend, ktorá sa dá vyjadriť ako „odošli a spracuj“**.

## Use cases, kde Server Actions NIE SÚ vhodné

1. **Nahrávanie súborov cez multipart formuláre väčšie ako pár MB** — Server Actions majú predvolený limit tela požiadavky 1 MB (konfigurovateľný cez `serverActions.bodySizeLimit`) a streaming je s nimi nepríjemný. Na upload použi samostatný route handler s `formidable` alebo podpísanú URL na S3.
2. **Prijímače webhookov** — externá služba volá tvoj endpoint. Action nie je verejne dostupná cez `curl` (kontroluje sa Origin oproti Host). Použi `app/api/webhook/route.ts`.
3. **OAuth callbacky** — poskytovatelia posielajú GET požiadavku s query parametrami. Server Actions bežia len cez POST. Route handler.
4. **Verejné REST API** — ak má tvoje API konzumovať mobilná aplikácia alebo iná služba, Server Actions nie sú správny nástroj. Použi route handlery s explicitným verziovaním.
5. **Dlho bežiace operácie** (nad 30 s) — Vercel serverless má timeout. Server Actions tiež. Na import 5000 produktov spusti background job (Inngest, Trigger.dev) a action ho len zaradí do fronty.

## Pravidlo, ktoré používam

Pýtam sa: **„Bude túto vec konzumovať niečo iné ako môj vlastný frontend?“**

- Áno → route handler (`route.ts`).
- Nie → Server Action.

Toto pokrýva 95 % situácií čisto.

## Real-world: brief form na mojom webe

Brief formulár, ktorý si klient vyplní pred prvým hovorom — 12 polí, validácia, posiela mi email a zapíše do Notion DB.

- **Pred Server Actions:** route handler `/api/brief`, validácia v Zode, volanie z klienta cez axios, ručný loading state, ručné mapovanie chýb, dva typy serializácie. **Zhruba 240 riadkov.**
- **Po Server Actions:** jeden súbor `actions.ts` (60 riadkov) plus jeden komponent formulára (40 riadkov). **Spolu 100 riadkov.**

Navyše v starom riešení som progressive enhancement **nemal**. Po prechode na Server Actions som ho dostal bez jediného riadku kódu naviac.

## Edge case: redirect po úspechu

```tsx
"use server";
import { redirect } from "next/navigation";

export async function sendForm(formData: FormData) {
  // process...
  redirect("/dakujeme");
}
```

`redirect()` musí byť **mimo try/catch** — interne vyhadzuje špeciálnu chybu (`NEXT_REDIRECT`), ktorú Next zachytáva, a `catch` by ju pohltil. Klasická pasca pre nováčikov.

## TL;DR

Server Actions ti zoberú 60 – 80 % boilerplatu pri formulároch, kde komunikuje len tvoj frontend s tvojím backendom. Pri webhookoch, nahrávaní súborov cez multipart, verejnom REST API či OAuth callbackoch ostaň pri route handleroch. Pravidlo: ak to konzumuje niekto iný ako môj formulár, urobím route. Inak action.
