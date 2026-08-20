# Outbound Batch #1 — 200 hand-researched leads

**Purpose of this batch is learning, not revenue.** At n=200 the realistic outcome
is ~10 replies, ~3 conversations, 0–1 paying customers. That is too small to prove
"cold email works." It is exactly the right size to find out whether the
direct-booking pitch lands with professional operators, and to hear the objections
in their own words.

Everything here is a spreadsheet and a mailbox. **No code, no pipeline, no
database.** If batch #1 works, we automate it. If it doesn't, we saved three months.

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Markets | **US + UK only** | The only two of our target markets where unsolicited B2B email is realistically lawful. UK = limited companies / LLPs only. |
| Angle | **Direct-booking website** | Largest findable audience, and the qualifier is visible from outside: they have a site but you can't actually book on it. |
| Ask | **15-minute call** | Every reply teaches us something, including the no's. |
| Identity | **New domain + Workspace mailbox** | Isolates propvian.com and the Resend account from any cold-email fallout. |

**Non-negotiable:** cold email never goes through Resend. Their AUP bans
unsolicited mail, and a suspension would take down verification codes and guest
PIN delivery — a product outage caused by a marketing experiment.

---

## 1. Who qualifies

A lead goes in the sheet only if **all four** are true:

1. It is a **business** — property management company, or a host operating under a
   trading name. UK: must be a Ltd or LLP (check Companies House). Sole traders are
   out — PECR treats them as individuals.
2. **5+ properties**, countable on their own public website. Not estimated.
3. They have a **website**, and it is **weak at taking bookings** — enquiry form,
   "email us for availability", WhatsApp link, or a dead/ugly booking widget.
4. The email is a **generic business mailbox** (info@, bookings@, hello@, stay@)
   published on their own site.

**Disqualify immediately if:**
- They already run Lodgify / Guesty / Hostaway / Hospitable / Bookster / Uplisting
  (look for the booking-engine iframe or a "Powered by" footer). Ripping out an
  incumbent is a different, much harder sale.
- The only contact is a named individual's personal address (`sarah@…`) — stricter
  rules, and it converts no better. Log it in a separate tab, don't email it.
- No website, Airbnb link only. Nothing to say to them yet.
- The site already has real live availability + card checkout. They've solved it.

**Why 5+ properties:** at $10/mo per property, a 3-property host is $30/mo. A
12-property manager is $120/mo. Hand-researched outbound only pays for the second
kind — and that's also the honest strategic finding to carry forward: **outbound is
for property managers; individual hosts should come from ads, SEO and communities.**

---

## 2. Where to find them

Public sources only. **No Airbnb scraping, no bypassing anything.** All of these are
manual searches — you are reading public websites, which is the point.

**US + UK, highest yield first:**

- Google Maps: `vacation rental management <city>`, `holiday let management <city>`
  (UK), `serviced apartments <city>`. The business listing gives you the website;
  the website gives you the property count and the mailbox.
- Google: `"book direct" apartments <city>`, `"our properties" holiday cottages <region>`,
  `<city> "short term rentals" -airbnb.com -booking.com`
- Competitor showcase pages — Lodgify/Hostaway/Guesty publish customer lists. These
  are *proven buyers* of this exact category. Take the ones who churned or look
  neglected; skip current happy customers.
- Association directories: **VRMA** (US), **STAA** and **PASC UK** (UK), regional
  tourist-board accommodation listings.
- Booking.com "Managed by <company>" on property pages — public, and it names the
  operator so you can then find their own site.

**Target cities (pick 4, go deep rather than wide):**
US — Orlando, Scottsdale, Gatlinburg, Asheville, Nashville, San Diego.
UK — Cornwall, Lake District, Edinburgh, Bath, Norfolk Broads, Pembrokeshire.

Rate: ~15 qualified leads/hour once you have the rhythm. 200 leads ≈ 13 hours.
Do it in 3 sittings; the pattern-recognition compounds.

---

## 3. The sheet

One Google Sheet, three tabs: `leads`, `individuals` (personal addresses, not
emailed), `suppression` (anyone who says stop, ever — append-only, never delete).

`leads` columns:

```
company | website | country | city | property_count | property_count_source_url
email | email_source_url | booking_setup | incumbent_software | companies_house_no
score | status | sent_1 | sent_2 | sent_3 | sent_4 | reply_date | reply_verbatim | outcome
```

`booking_setup` — one of: `enquiry_form`, `email_only`, `whatsapp`, `broken_widget`, `none`.
`status` — `new` → `queued` → `sequence` → `replied` → `call_booked` → `won` / `lost` / `stop`.

**`reply_verbatim` is the most valuable column in this file.** Paste what they
actually wrote, not your summary of it.

Skip lead scoring for batch #1. With 200 hand-picked leads, the qualifier list above
*is* the score. Scoring formulas only earn their keep when a machine is choosing.

---

## 4. Sending setup

1. Buy a separate domain — `propvian.io`, `getpropvian.com`, `trypropvian.com`.
   **Never send cold mail from propvian.com.**
2. Google Workspace mailbox on it (~$7/mo). Redirect the domain root to propvian.com.
3. SPF, DKIM, **DMARC `p=none` to start**, then tighten.
4. **Warm up 10 days** before the first send: real conversations, newsletters,
   replies. Then ramp 5 → 10 → 15/day. Never more than 20/day from one mailbox.
5. Cal.com link for the 15-minute slot. Put it in email 3, not email 1.
6. One landing page with UTMs, wired to the V55 attribution capture, so an
   outbound-sourced signup is distinguishable from a Google Ads one.

**Send by hand, one at a time.** At 15/day this is 10 minutes of work, it delivers
better than any tool, and you'll edit half the emails once you see the site again —
which is the whole advantage of doing 200 instead of 20,000.

---

## 5. The sequence

Four emails over 16 days. **Stop the entire sequence the moment** they reply, bounce,
unsubscribe, or ask to be left alone. No exceptions, no "one last check-in."

Only state facts you have personally verified on their site. Never invent a property
count, a city, or a technology. If you can't count the properties, the lead doesn't
qualify — don't guess in order to personalise.

### Email 1 — Day 0

> **Subject:** booking direct on {{website_domain}}
>
> Hi {{first_name_or_blank}},
>
> I was going through {{website_domain}} — you've got {{property_count}} places
> around {{city}}, and the site looks great, but guests can only {{booking_setup_phrase}}
> rather than see live availability and pay.
>
> I built Propvian, which fixes exactly that bit: your calendars from Airbnb and
> Booking.com feed a real booking page on your own domain, and guests pay you
> directly through your own Stripe account. Nothing routes through us, and there's
> no commission — ours or an OTA's.
>
> Worth 15 minutes next week to see if it fits how you work? If a call's too much,
> say the word and I'll send a 2-minute video instead.
>
> Ali — founder, Propvian
> {{postal_address}} · Don't want to hear from me? Reply "stop" and I'll remove you.

`booking_setup_phrase` = "send an enquiry form" / "email you for dates" / "message
you on WhatsApp" — whatever is literally true on their site.

### Email 2 — Day 4

> **Subject:** re: booking direct on {{website_domain}}
>
> Following up once, then I'll leave it.
>
> The reason I bothered: with {{property_count}} properties, the OTA commission plus
> the guest service fee is usually 15–20% of your gross. The guests who'd have
> booked you directly — repeat visitors, referrals, people who found you on Google —
> are the cheapest bookings you'll ever get, and they're the ones an enquiry form
> loses at 11pm on a Sunday.
>
> Propvian is $10/month per property and the first month is free, so the maths only
> has to work once.
>
> Ali
> {{postal_address}} · Reply "stop" to be removed.

### Email 3 — Day 9

> **Subject:** 2-minute look
>
> Last useful thing I can offer: here's what a direct-booking page looks like built
> on Propvian — {{demo_link}}. Live calendar, card payment to the host's own Stripe,
> self check-in codes if they run smart locks.
>
> If it's interesting: {{cal_link}}, 15 minutes, whenever suits.
>
> Ali
> {{postal_address}} · Reply "stop" to be removed.

### Email 4 — Day 16

> **Subject:** closing the loop
>
> Haven't heard back, so I'll assume the timing's wrong and stop emailing.
>
> If it's useful later, propvian.com is there. And if you'd rather I never write
> again, just reply "stop" — no hard feelings either way.
>
> One favour if you have 10 seconds: was it the wrong time, the wrong product, or
> the wrong person? Genuinely helps.
>
> Ali
> {{postal_address}} · Reply "stop" to be removed.

**Email 4 is the highest-value email in the sequence for batch #1.** "Wrong time,
wrong product, or wrong person" gets answered by people who ignored everything else,
and the answer tells you what to change.

---

## 6. Answering replies

Reply within an hour during working hours. A cold reply goes cold in a day.

- *"How is this different from Lodgify?"* → Don't rubbish them. Price ($10/property
  vs their per-account tiers) and the smart-lock/PIN automation being included
  rather than a bolt-on. Be honest that they're a bigger, older product.
- *"We're happy with what we have."* → "Fair enough — what are you using? Genuinely
  asking, it helps me know what I'm up against." This is free market research and
  people answer it.
- *"How much work is setup?"* → Be truthful about the real number. Overselling this
  is how you get a refund and a bad review.
- *"Do I need smart locks?"* → No. Direct booking works standalone; the locks are
  additive and TTLock-only today.
- *"Stop" / "unsubscribe" / anything hostile* → Add to suppression tab immediately.
  Don't reply defending yourself. Don't ever contact them again.

---

## 7. Compliance rules for this batch

- Business mailboxes at incorporated companies only. UK sole traders excluded.
- Every email: real physical postal address, working opt-out, honest subject line,
  honest "from" name. No open-tracking pixels for batch #1 — you're sending 15/day
  and you're reading every reply; the pixel buys nothing and costs you a consent
  argument.
- Suppression list is append-only and checked before every send.
- Log where each email address came from (`email_source_url`). If anyone ever asks
  where you got their address, you must be able to answer in one click.

*Not legal advice. Rules shift — worth a lawyer's hour before scaling past this batch.*

---

## 8. Kill / scale thresholds

Decide these **now**, before any replies arrive, so you're not reading tea leaves later.

| Result after 200 sends | Read | Action |
|---|---|---|
| ≥ 10 replies, ≥ 3 real conversations | ICP and message are right | Scale to 500–1000, add a proper tool, *then* consider building the pipeline |
| 3–9 replies, mostly "not now" | Message is close, ICP is right | Rewrite email 1 only, run batch #2 to a fresh 200 |
| < 3 replies | Wrong segment or wrong pitch | **Stop outbound.** Put the hours into ads/SEO/communities, which suit a $10/mo product better anyway |
| Replies but nobody books a call | Ask is too heavy | Swap the CTA to a Loom video or free-setup offer |

Track hours spent. If batch #1 costs 30 hours and produces one $120/mo customer,
that's a fine *learning* outcome and a bad *channel* outcome — and the difference
between those two matters more than the revenue.

---

## 9. Campaign landing page & demo (built 2026-08-19)

**Landing page:** `propvian.com/property-managers` — `noIndex`, slim header, one CTA.
Source: `frontend/src/pages/marketing/PropertyManagersPage.tsx`.

**Demo site:** `propvian.com/sites/harbour-lane-stays` — "Harbour Lane Stays", a
fictional three-property operator in St Ives, Cornwall (£145–£420/night). Photos
are Unsplash-licensed and self-hosted at `frontend/public/demo-photos/` so the
demo does not break if a third-party CDN does.

### Link format for the sequence

```
https://propvian.com/property-managers
  ?utm_source=outbound
  &utm_medium=email
  &utm_campaign=outbound-batch1
  &utm_content=email1              # which email in the sequence
  &utm_term=coastal-retreats-ltd   # the lead slug, from the sheet
```

Verified end to end: those five parameters are captured on landing, survive to
signup, and land on the `users` row (`utm_campaign`, `utm_content`, `utm_term`,
`landing_page`). A signup can therefore be traced back to the exact lead **and**
the exact email that produced it. The same parameters are forwarded into the
Cal.com booking, which is the only place a booked call gets recorded.

Put `utm_term` in the sheet as a column and keep it identical to the lead row —
it is what joins a signup back to the company you emailed.

### Before the first send

1. **Create the Cal.com event** at `cal.com/propvian/15min` (15 min). The page
   currently renders its fallback because that handle does not exist. Override
   with `VITE_CAL_LINK` if you pick a different one.
2. **Connect Stripe (test mode) to the demo org** — the demo property pages show
   "Bookings temporarily unavailable" without a payment provider, which reads as
   a broken product to a prospect.
3. Re-create the demo org on production; it currently exists only locally.
