---
title: "Next.js form actions: the end of API endpoints for 80% of forms"
date: 2026-04-02
read: 7
tags: ["Next.js", "React"]
excerpt: "Server Actions replace your /api/contact route handlers: 80 lines instead of 250, with progressive enhancement for free. But they aren't a fix for everything."
featured: false
---

Two years ago, for a contact form, I'd write a `/api/contact` route handler, the validation, the client-side call, the error handling, the loading state. Roughly **250 lines** scattered across three or four files. Today I do it with a Server Action in **80 lines in a single file**. And it works without JavaScript, too.

## What a Server Action is

A function tagged `"use server"` that runs on the server but can be called directly from a React component (like an event handler). Next.js handles the serialization, the transport, and the error handling. You write the logic; it deals with the plumbing around it. It's the same server-first mindset as [React Server Components](/en/blog/server-components-5-veci/) — data and logic stay on the server and you ship as little as possible to the client.

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

And the form:

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

And that's the **entire working contact form** — validation, error handling, loading state, and success state. **80 lines.**

(Note: the original `useFormState` from `react-dom` was replaced in React 19 by the `useActionState` hook from `react` — I'm already using the newer one here.)

This all assumes the App Router — you don't get Server Actions in the Pages Router. If you're still deciding which router to build on, take a look at [App Router vs Pages Router in 2026](/en/blog/nextjs-app-vs-pages-router/).

## Progressive enhancement for free

This is the **killer feature** that gets underrated. Server Actions work even **without JavaScript**.

`<form action={sendContactMessage}>` — if JavaScript doesn't load in time or is turned off, the browser does a standard POST submit, the server catches the action, runs it, and hands you back an updated page. **The user can submit the form even without React.**

Without Server Actions that meant an HTML fallback form, a JS handler, and two separate backend endpoints. Now you get it for free.

## Use cases where Server Actions fit

From my own work over the past year:

- **Contact / brief / inquiry forms** — 90% of web projects.
- **Newsletter signups** — a direct write to the DB or a call to the Mailchimp API.
- **Blog comments** — a moderation flag, an optimistic update.
- **Admin CRUD** — create/update/delete in low-traffic dashboards.
- **Search forms** with an action that uses `redirect()` — submit → `/search?q=...`.
- **like / save / bookmark actions** with `useOptimistic`.

The common denominator: **a user ↔ your-own-backend interaction that can be expressed as "submit and process."**

## Use cases where Server Actions are NOT a good fit

1. **File uploads via multipart forms bigger than a few MB** — Server Actions have a default request body limit of 1 MB (configurable via `serverActions.bodySizeLimit`), and streaming with them is a pain. For uploads, use a separate route handler with `formidable` or a signed URL to S3.
2. **Webhook receivers** — an external service calls your endpoint. An action isn't publicly reachable via `curl` (it checks Origin against Host). Use `app/api/webhook/route.ts`.
3. **OAuth callbacks** — providers send a GET request with query params. Server Actions only run over POST. Route handler.
4. **A public REST API** — if your API is meant to be consumed by a mobile app or another service, Server Actions are the wrong tool. Use route handlers with explicit versioning.
5. **Long-running operations** (over 30s) — Vercel serverless has a timeout. So do Server Actions. To import 5,000 products, kick off a background job (Inngest, Trigger.dev) and have the action just enqueue it.

## The rule I use

I ask: **"Will anything other than my own frontend consume this?"**

- Yes → route handler (`route.ts`).
- No → Server Action.

That covers 95% of situations cleanly.

## Real-world: the brief form on my own site

A brief form clients fill out before the first call — 12 fields, validation, emails me and writes to a Notion DB.

- **Before Server Actions:** a `/api/brief` route handler, Zod validation, a client-side call via axios, a hand-rolled loading state, manual error mapping, two kinds of serialization. **About 240 lines.**
- **After Server Actions:** one `actions.ts` file (60 lines) plus one form component (40 lines). **100 lines total.**

On top of that, the old setup had **no** progressive enhancement. After moving to Server Actions I got it with zero extra lines of code.

## Edge case: redirect on success

```tsx
"use server";
import { redirect } from "next/navigation";

export async function sendForm(formData: FormData) {
  // process...
  redirect("/dakujeme");
}
```

`redirect()` has to be **outside try/catch** — internally it throws a special error (`NEXT_REDIRECT`) that Next catches, and a `catch` would swallow it. A classic rookie trap. And if you need to re-render data after a successful submit, it helps to know [when to reach for revalidate, tag, or path](/en/blog/nextjs-cache-revalidate/).

## TL;DR

Server Actions strip out 60–80% of the boilerplate for forms where it's just your frontend talking to your backend. For webhooks, multipart file uploads, a public REST API, or OAuth callbacks, stick with route handlers. The rule: if something other than my form consumes it, I make a route. Otherwise, an action.
