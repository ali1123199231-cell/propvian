# Batch #1 — sequence, ready to send

Two leads clear every qualifier in `outbound-batch-1.md` **and** the PECR
requirement that a UK recipient be a limited company. Every factual claim below
was verified on the operator's own public website on 2026-08-20; nothing is
estimated. Sources: `batch1-research-2026-08-20.csv`.

## Sending mechanics (decided 2026-08-20)

- **From:** an existing Gmail, sent by hand, one at a time.
- **Reply-To:** `ali@propvian.com` — or any `@propvian.com` address. A Cloudflare
  Email Routing **catch-all is enabled** and forwards everything on the domain to
  `ali1123199231@gmail.com`, so no mailbox needs creating and nothing is bought.
  Reply-To has no bearing on SPF/DKIM/DMARC, so deliverability stays on Gmail's
  reputation while replies land on the domain.
- **Never** send these through Resend. Its AUP bans unsolicited mail and a
  suspension would take down verification codes and guest PIN delivery.
- **No postal address line.** Both leads are UK, where PECR requires a valid
  address for opt-out — the reply-to address satisfies that. **If a US lead is
  ever added, CAN-SPAM requires a real physical postal address in every email**
  and these drafts must gain one first.
- **The ask is a reply, not a call.** `cal.com/propvian/15min` does not exist and
  is deliberately not used here.

**Stop the entire sequence the moment** they reply, bounce, unsubscribe or ask to
be left alone. Log every stop in `suppression.csv`, append-only.

Demo link, live and verified: **https://harbour-lane-stays.propvian.com**

---

## Lead 1 — North Wales Holiday Cottages Ltd
`info@northwalesholidaycottages.co.uk`

Verified: 10 cottages listed (Pant Glas, Swn y Mor Deganwy, Eleven, Maes Glas,
Glan Lledr, Ty'r Efail, Orme View, Glain Orme, Dolphin House, White O Morn);
enquiry-based, no live availability or card payment; no booking engine detected.
Companies House 09827850, active, incorporated 2015, Deganwy.

### Email 1 — day 0
> **Subject:** booking direct on northwalesholidaycottages.co.uk
>
> Hi,
>
> I was going through northwalesholidaycottages.co.uk — you've got ten cottages
> around Deganwy and the Conwy coast, and the site itself looks good, but a guest
> can only enquire rather than see live availability and pay there and then.
>
> I built Propvian, which fixes exactly that bit: your calendars from Airbnb and
> Booking.com feed a real booking page on your own domain, and guests pay you
> directly through your own Stripe account. Nothing routes through us, and there's
> no commission — ours or an OTA's.
>
> Is the enquiry-then-email step a deliberate choice, or just how it ended up?
> Genuinely curious either way — a one-line reply is plenty.
>
> Ali — founder, Propvian
> Don't want to hear from me? Reply "stop" and I'll remove you.

### Email 2 — day 4
> **Subject:** re: booking direct on northwalesholidaycottages.co.uk
>
> Following up once, then I'll leave it.
>
> The reason I bothered: with ten cottages, the OTA commission plus the guest
> service fee is usually 15–20% of your gross. The guests who'd have booked you
> directly — repeat visitors, referrals, people who found you on Google — are the
> cheapest bookings you'll ever get, and they're the ones an enquiry form loses at
> 11pm on a Sunday.
>
> Propvian is $10/month per property and the first month is free, so the maths only
> has to work once.
>
> Ali
> Reply "stop" to be removed.

### Email 3 — day 9
> **Subject:** 2-minute look
>
> Last useful thing I can offer: here's what a direct-booking page built on
> Propvian actually looks like — https://harbour-lane-stays.propvian.com. Live
> calendar, card payment to the host's own Stripe, self check-in codes if they run
> smart locks.
>
> If it's worth a conversation, just reply and I'll answer whatever's useful.
>
> Ali
> Reply "stop" to be removed.

### Email 4 — day 16
> **Subject:** closing the loop
>
> Haven't heard back, so I'll assume the timing's wrong and stop emailing.
>
> If it's useful later, propvian.com is there. And if you'd rather I never write
> again, just reply "stop" — no hard feelings either way.
>
> One favour if you have 10 seconds: was it the wrong time, the wrong product, or
> the wrong person to ask? Even one word helps me stop bothering people like you.
>
> Ali

---

## Lead 2 — Wayford Marine Ltd (Norfolk Holiday Accommodation)
`enquiries@norfolkholidayaccommodation.co.uk`

Verified: 6 properties (Beech Barn, Willow Barn, Alderfen Barn, Ferry Cottage,
Kings Lodge and one further); the site says "book direct with us, the owners" but
offers no live availability or card payment; no booking engine detected.
Companies House 04193213, active, incorporated 2001.

### Email 1 — day 0
> **Subject:** booking direct on norfolkholidayaccommodation.co.uk
>
> Hi,
>
> I was going through norfolkholidayaccommodation.co.uk — six places on the
> Broads, and you already tell guests to book direct with you, the owners. The bit
> that's missing is the mechanism: they still have to email you and wait, rather
> than see live availability and pay.
>
> That's the whole of what I built Propvian for. Your calendars from Airbnb and
> Booking.com feed a real booking page on your own domain, and guests pay you
> directly through your own Stripe account. No commission — ours or an OTA's.
>
> Is taking payment online something you've looked at and decided against? A
> one-line reply is plenty — I'd rather know than keep guessing.
>
> Ali — founder, Propvian
> Don't want to hear from me? Reply "stop" and I'll remove you.

*(Emails 2–4 as above, substituting "six properties on the Broads".)*

---

## Do not contact yet

- **Wales Cottages** (walescottages.com) — booking form literally fails to load,
  the strongest weak-booking signal found. Needs a property count and a Companies
  House match first.
- **Serviced Lettings** (`stay@serviced-lettings.com`) — 5 Edinburgh apartments,
  generic mailbox, but no confident Companies House match. PECR needs the legal
  entity confirmed before a UK send.
- **Cottage Retreats** (`cottageretreatspembs@gmail.com`) — enquiry-only with no
  engine, but the mailbox is a Gmail not their own domain, the count is not
  stated, and no limited company was found. Likely a sole trader, whom PECR treats
  as an individual. Log in `individuals`, do not email.
