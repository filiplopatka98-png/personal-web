---
title: "WordPress Website Maintenance: Cost and What Should Be Included (2026)"
date: 2026-11-25
read: 6
tags: ["WordPress", "Website maintenance", "Support"]
excerpt: "What WordPress website maintenance costs in Slovakia, what should be in the price and what to ask before you give anyone access to your admin."
metaDescription: "WordPress website maintenance: monthly cost, what the price should include (updates, backups, monitoring) and what to ask before you sign."
featured: false
faq:
  - q: "How much does WordPress website maintenance cost per month?"
    a: "According to public price lists of Slovak providers (November 2026), basic maintenance mostly runs from about 30 to 40 EUR per month, and packages with prepaid editing hours and faster response from 60 to 160 EUR per month. Work beyond the package is billed hourly, typically 25 to 40 EUR per hour. Online stores cost more because orders and payments have to be tested."
  - q: "What should website maintenance include?"
    a: "At minimum: updates of WordPress, plugins and theme, a backup before updating, a test after updating and uptime monitoring. If there is no backup or post-update test in the price, it is not maintenance, just clicking the Update button."
  - q: "Are automatic WordPress updates enough?"
    a: "For a simple site, often yes. WordPress updates minor core releases and translations on its own, but plugins and themes only in exceptional cases by default. Automation also cannot check that your form or cart still works after an update."
  - q: "Is website maintenance the same as hosting?"
    a: "No. Hosting is the server the site runs on. Maintenance is work on the site itself: updates, backups, checks, fixes. Domain and hosting are a separate yearly cost and are normally not included in the maintenance price."
  - q: "Can I cancel website maintenance at any time?"
    a: "You should be able to. Ask about the notice period before you start, not when you leave. Just as important: you should always hold the access details and backups too, not only the maintainer."
---

A site that works looks like a finished thing. But WordPress, plugins and themes release updates all the time, and any of them can break something. Maintenance is work you cannot show in a photo, which is exactly why it is hard to tell what it should cost and what you get for the money. I write this as someone who looks after sites on a regular basis, so this is the practical view, not a marketing one.

## How much does WordPress maintenance cost

I looked at the public price lists of Slovak providers on 25 November 2026. The picture is fairly consistent:

- **Basic package: mostly 30 to 40 EUR per month.** Updates, backups, uptime monitoring. No prepaid editing hours.
- **Middle package: roughly 60 to 80 EUR per month.** The same plus an hour of edits a month and faster response.
- **Higher package: roughly 150 to 160 EUR per month.** Daily backups, two hours of edits, a reply within 24 hours.
- **Hourly rate beyond the package: 25 to 40 EUR per hour.**
- **One-off takeover of someone else's site: around 129 EUR** (audit, plugin clean-up, backup setup).

My own prices are in the same range: maintenance from 39 EUR per month, online stores from 79 EUR per month, extra work at 30 EUR per hour. The exact price depends on the site, so I set it only after looking at the actual site.

What matters is what the price **does not include**: domain and hosting (roughly 50 to 80 EUR a year), licences for paid plugins, and repairs after a hack or after someone else's bad intervention. For an online store maintenance costs more, because after every update you have to test the cart, payment and an order, not just the home page. How the price of a store comes together as a whole is in the article [what a website and online store cost](/en/blog/kolko-stoji-web-eshop-2026/).

## What a maintainer does when "nothing happens"

For a regular monthly update I follow the same routine on every site:

1. **I check that a fresh backup exists.** Most sites I look after run on hosting with daily backups and a 7-day history. Where that is not the case, I agree on a separate solution. Updating without a backup is gambling.
2. **I update in this order: WordPress core, plugins, theme.** Risky plugins one by one, not everything at once. If something breaks, I see immediately what caused it.
3. **I test the site:** the home page, the key action (contact form, booking, cart) and mobile. For a store, an order too.
4. **I check uptime monitoring.** My own tool checks the site regularly and sends me an email if it goes down. I then write to the client on my own: "The site had an outage, it is back up, we are watching it."

A routine update of one site usually takes me 5 to 10 minutes. It takes longer when something goes wrong. Then I go back to the backup and look for the culprit plugin by plugin. That is also what the WordPress documentation recommends: back up before updating, update plugins one at a time, and if the layout breaks, deactivate plugins and reactivate them one by one.

That shows what you are really paying for. Not 10 minutes of clicking, but **someone being responsible when an update goes wrong**, and you hearing about it before a customer calls you.

## Are automatic updates enough?

For a simple business card site nobody edits, often yes. But you need to know what WordPress does on its own. According to its documentation, minor core releases and translations update automatically by default. Plugins and themes only in exceptional cases, when a critical security patch is involved. Everything else is up to you.

You can switch on automatic updates for plugins too, but there is a catch: nobody checks that your form or order still works afterwards. For a store that is a risk not worth taking. Cleaning up plugins and speeding up the site is extra work, and it comes with the question of [what to fix first: speed or SEO](/en/blog/seo-rychlost-webu-poradie/).

## What to ask before you sign

These questions save you more trouble than a difference of a few euros in price:

- **Where are the backups and how long are they kept?** Backups on the same server as the site do not help if the server fails.
- **Is a backup made before every update?** It should be.
- **Is there a test after the update?** What exactly? The home page is not enough.
- **What happens when an update breaks the site?** Who fixes it and whether it is in the price.
- **What is included and what is billed separately?** Hours of edits, takeover, licences.
- **Do you get a report?** At least a short record of what was done that month.
- **How can you leave?** Notice period, lock-in.
- **Who holds the access?** The domain, hosting and admin should belong to you. The maintainer should have their own account, not your password.

## When you do not need paid maintenance

If you have a small static site that you change once a year and your hosting backs up daily, you can look after it yourself. Once a month, go through the updates following the routine above. If you do not mind whether the site is down for an hour or a day, that is a reasonable choice.

Paid maintenance pays off where the site brings enquiries or sales, has many plugins or is a store. There a single bad update is counted in lost orders, not minutes.

## Want to know what state your site is in?

I will look at the site, we will go through what needs updating and whether regular maintenance makes sense or a one-off update is enough. The site review is free. If you are deciding what kind of site you need in the first place, the article [WordPress or a custom-built site](/en/blog/wordpress-alebo-web-na-mieru/) will help. Services and prices are on the [services page](/en/services/).
