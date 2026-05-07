---
title: "Next.js form actions: koniec API endpointov pre 80 % formulárov"
date: 2026-04-02
read: 7
tags: ["Next.js", "React"]
excerpt: "Server Actions nahrádzajú /api/contact route handlery. 80 LOC namiesto 250, progressive enhancement zadarmo. Ale nie sú zázrak na všetko."
featured: false
---

Pred dvomi rokmi som pre kontaktný formulár písal: route handler `/api/contact`, validáciu, fetch z klienta, error handling, loading state. Cca **250 LOC** spread cez 3-4 súbory. Dnes to spravím cez Server Action za **80 LOC v jednom súbore**. A funguje to aj bez JS.

## Čo je Server Action

Funkcia označená `"use server"`, ktorá beží na serveri ale dá sa zavolať priamo z React komponenty (ako event handler). Next.js zariadi serializáciu, transport, error handling. Ty napíšeš logiku, on rieši plumbing.

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

import { useFormState, useFormStatus } from "react-dom";
import { sendContactMessage } from "./actions";

export default function ContactPage() {
  const [state, formAction] = useFormState(sendContactMessage, { ok: false });

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

To je **celý funkčný kontakt formulár** — validácia, error handling, loading state, success state. **80 LOC.**

## Progressive enhancement zadarmo

Toto je **killer feature**, ktorá sa neoceňuje. Server Actions fungujú aj **bez JS**.

`<form action={sendContactMessage}>` — ak sa JS nestihne načítať alebo je vypnutý, prehliadač spraví štandardný POST submit, server zachytí action, vykoná ju, vráti ti aktualizovanú stránku. **User submitne formulár aj bez React-u.**

Bez Server Actions to znamenalo: HTML form fallback + JS handler + dva rôzne backend endpointy. Teraz to máš zadarmo.

## Use cases, kde sa Server Actions hodia

Z mojej praxe za posledný rok:

- **Contact / brief / dopyt formuláre** — 90 % web projektov.
- **Newsletter signup** — direct insert do DB alebo Mailchimp API call.
- **Komentáre k blogu** — moderation flag, optimistic update.
- **Admin CRUD** — create/update/delete v low-traffic dashboard-och.
- **Search forms** s `redirect()` action — submit → `/search?q=...`.
- **Like / save / bookmark** akcie s `useOptimistic`.

Spoločný menovateľ: **interakcia user ↔ vlastný backend, ktorá sa dá vyjadriť ako "submit a spracuj"**.

## Use cases, kde Server Actions NIE SÚ vhodné

1. **File uploads s multipart formami väčšími ako pár MB** — actions majú default body limit (1MB v Next.js 15) a streaming je nepríjemný. Pre upload použiť dedicated route handler s `formidable` alebo signed URL k S3.
2. **Webhook receivers** — externý service volá tvoj endpoint. Action nie je verejne dosiahnuteľná z curl-u (security tokenovanie). Použi `app/api/webhook/route.ts`.
3. **OAuth callbacks** — providery posielajú GET request s query params. Actions sú POST-only. Route handler.
4. **Public REST API** — ak má tvoju API konzumovať mobile app alebo iný service, actions nie sú správny tool. Použi route handlers s explicit verzionovaním.
5. **Long-running operations** (>30s) — Vercel serverless má timeout. Actions tiež. Pre import 5000 produktov spusti background job (Inngest, Trigger.dev) a action len enqueue-ne.

## Pravidlo, ktoré používam

Pýtam sa: **"Bude túto vec konzumovať niečo iné ako môj vlastný frontend?"**

- Áno → route handler (`route.ts`).
- Nie → Server Action.

Toto pokrýva 95 % situácií čisto.

## Real-world: brief form na mojom webe

Brief form, ktorý si klient vyplní pred prvým hovorom — 12 polí, validácia, posiela mi email a zapíše do Notion DB.

- **Pred Server Actions:** route handler `/api/brief`, validácia v Zod-e, fetch z klienta s axios, manual loading state, manual error mapping, dva typy serialization. **Cca 240 LOC.**
- **Po Server Actions:** jeden súbor `actions.ts` (60 LOC) + jeden form komponent (40 LOC). **100 LOC total.**

Plus v starom riešení som **nemal** progressive enhancement. Po Server Actions som ho dostal bez čiar kódu navyše.

## Edge case: redirect po úspechu

```tsx
"use server";
import { redirect } from "next/navigation";

export async function sendForm(formData: FormData) {
  // process...
  redirect("/dakujeme");
}
```

`redirect()` musí byť **mimo try/catch** (vyhadzuje special error, ktorý Next zachytáva). Common gotcha pre nováčikov.

## TL;DR

Server Actions ti zoberú 60-80 % boilerplate-u pri formulároch, kde komunikuje len tvoj frontend s tvojím backendom. Pre webhooky, file uploady cez multipart, public REST API, alebo OAuth callbacky ostaň pri route handleroch. Pravidlo: ak to konzumuje niekto iný ako môj formulár, urobím route. Inak action.
