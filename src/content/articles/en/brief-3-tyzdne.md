---
title: "The Brief That Saves You 3 Weeks of Misunderstandings"
date: 2026-04-15
read: 7
tags: ["Process", "UX"]
excerpt: "5 sections, one A4 page: goal, audience, scope, constraints, success criteria. Real ROI: 2 hours on a brief saves 3 weeks of implementation arguments."
featured: false
---

Without a brief, the client says "build me a website," and six weeks later wonders why it doesn't have a booking system. You're wondering why the client had anything in mind other than a landing page. A brief kills 80% of these situations.

This is the five-section template I use on every new project. Filling it out takes 2 hours (client + me), and saves 3 weeks down the line. It's not a metaphor — it's the real difference between a project with a brief and one without.

## Section 1: Goal

**1 sentence + 1 metric.** Nothing more.

Example:

> The site should generate 30 qualified leads per month for the B2B sales team. Metric: submitted forms with the "company" field filled in.

What NOT to put in the goal:

- "Be modern and professional" — that's not a goal, that's a feeling
- "Improve SEO" — for which keywords? What flows from it?
- "Have a new site" — that's an action, not a goal

If the client can't state the goal in one sentence, the project isn't ready. Send them back to [a discovery call](/en/blog/discovery-call-30-minut/), or set up a meeting where you piece it together together.

## Section 2: Audience

**Who, why they show up, where they are now.** 3 sentences.

Example:

> **Who:** buyers at construction companies, 35–50 years old, B2B.  
> **Why they show up:** they're looking for a supplier for a specific project and need a fast quote.  
> **Where they are now:** Googling "construction materials bratislava supply," references on LinkedIn, a colleague's recommendation.

That's it. No persona document with a name, hobbies, and a Spotify playlist. These 3 sentences define for you:

- Tone (B2B → matter-of-fact, no startup slang)
- Content priority (fast quote → prominent "Request a quote" CTA)
- Acquisition channel (search → SEO + ads, not social media)

If the project has 2 distinct audiences (e.g., an e-shop with both B2B and B2C customers), do this section twice. No more. 4 audiences = the project has no focus.

## Section 3: Scope

Three columns: **In, Out, Later.**

```
IN (included):
- Landing page + 5 subpages
- Blog template (no content)
- Contact form with lead routing to CRM
- GDPR-compliant cookie bar
- Basic SEO setup (sitemap, robots, meta tags)

OUT (not our responsibility):
- Copywriting (client provides)
- Brand identity / logo redesign
- Email marketing setup (existing Mailchimp)
- Product photos (client supplies)

LATER (phase 2, separate scope):
- Multilingual (EN version)
- Booking system / calendar
- Members area with logged-in users
- Native mobile app
```

The `LATER` section is important — it captures the things the client mentions as "we might want that someday." Without it, they end up in phase 1 and push the deadline out by a month. With a `LATER` section, the client has it in black and white: "we agreed we'd tackle these things later."

## Section 4: Constraints

4 subsections:

**Deadline.**
> Launch November 30, 2026. Hard — tied to the Black Friday campaign.

**Budget.**
> 12,000–15,000 EUR (±20%). Agreed with the CFO.

**Technical limits.**
> Hosting on the existing AWS account. CMS must be WordPress (the internal team knows it). Email integration with Mailchimp (existing).

**Brand.**
> Existing brand manual (PDF, 2024). Colors: #003366, #FFAA00, #FFFFFF. Font: Inter. Tone: matter-of-fact, B2B, no humor.

If the client leaves any of the 4 sections blank, you have clear next steps:

- No deadline → "what's the latest possible launch date?"
- No budget → "do you have a range, ±50%?"
- No technical limits → you propose the stack
- No brand → you need to schedule a brand workshop before design

## Section 5: Success Criteria

**When we're done. Who signs off.**

Example:

```
DONE when:
- The site is deployed on the client's production domain
- Lighthouse Performance ≥ 90 on mobile for the top 5 pages
- Contact form tested end-to-end (form → CRM)
- Cookie bar approved by the client's DPO
- Client has CMS access and can edit blog posts (1 h of training)

SIGN-OFF:
- Final design → marketing manager (Anna K.)
- Copy → content lead (Peter M.)
- Technical setup → CTO (Tomáš S.)
- Approval to launch → CEO (Martin L.)
```

If success criteria aren't defined, there's always "just one more small thing" at the end of the project. There won't be. The client has nothing in black and white about when the project ended. This solves that.

## What NOT to put in a brief

- **Implementation details.** "Use the Yoast SEO plugin, the Astra theme, Elementor Pro." That's the developer's call. The client cares about the **what**, not the **how**.
- **Wireframes.** If the client draws 3 wireframes and sends them over, they're briefing the output instead of the goal. Wireframes happen during design. A brief is words.
- **"Build it like Stripe, but for us."** That's an antipattern. Stripe has thousands of engineers, a billion-dollar budget, and a completely different product. Specific references for inspiration are fine ("we like section X on site Y, because Z"), but "like Stripe" is not a spec.
- **Detailed copy.** "The hero text will be Z." A brief is a **goal**, not **content**. Copy gets written during implementation, based on SEO research and design.

## Who fills out the brief

Ideal state: **the client fills out 80%, I add the remaining 20%.**

Reality: the client fills out 40%, I add 60%. On a 90-minute call we go through the template together — I ask questions, the client answers, I write it down.

If the client refuses to fill out a brief ("no time, just give me a price"), that's a commitment test. Without a brief the project fails; a client who won't fill out a brief isn't committed to going through with it. I don't take those projects.

## Real ROI

My last 3 projects with a brief:

- **Discovery:** 2 hours (90-minute call + 30 minutes of writing)
- **Implementation phase:** 3–6 weeks, 2–3 scope changes (both sides accept them)
- **Disputes:** none

The previous 3 projects without a brief:

- **Discovery:** 30 minutes of "quick call, I know what you want"
- **Implementation phase:** 5–10 weeks, 8–12 scope changes (disagreements over what was agreed)
- **Disputes:** in 2 of 3 projects

For 1 average project: a brief saves ~3 weeks of calendar time and prevents ~5 scope fights. The client pays less (no rework), and I earn the same (same hours, but on value-add work instead of clarification calls). This ties directly into how you [structure the price](/en/blog/cenotvorba-eshop-models/) — a tight scope is what makes a fixed price safe to quote.

## Brief template (short copy-paste version)

```markdown
# Brief: [Project name]

## 1. Goal
The site should _______ (1 sentence). Metric: _______.

## 2. Audience
**Who:** _______
**Why they show up:** _______
**Where they are now:** _______

## 3. Scope
**IN:** _______
**OUT:** _______
**LATER:** _______

## 4. Constraints
- Deadline: _______
- Budget: _______
- Technical: _______
- Brand: _______

## 5. Success criteria
**Done when:** _______
**Sign-off:** _______
```

One A4 page is enough. Notion or a Google Doc, shared link. No PDF, no PowerPoint.

## Summary

5 sections, one page: goal (1 sentence + metric), audience (3 sentences), scope (in/out/later), constraints (deadline/budget/tech/brand), success criteria (when it's done + who signs off). Filling it out: 2 h; savings: ~3 weeks. Without a brief, projects fail on scope creep.
