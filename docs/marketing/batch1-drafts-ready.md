# Batch #1 — email 1 drafts, ready to send

Two leads clear every qualifier in `outbound-batch-1.md` **and** the PECR
requirement that a UK recipient be a limited company. Every factual claim below
was verified on the operator's own public website on 2026-08-20; nothing is
estimated. Sources are in `batch1-research-2026-08-20.csv`.

**Before sending, two placeholders must be filled:**
- `{{postal_address}}` — a real postal address is legally required in the footer
  (CAN-SPAM, and good practice under PECR). There isn't one on file.
- `{{cal_link}}` — `cal.com/propvian/15min` still returns 404. It only appears in
  email 3, so it does not block these two.

Demo link used in email 3 is live and verified: **https://harbour-lane-stays.propvian.com**

---

## 1. North Wales Holiday Cottages Ltd — info@northwalesholidaycottages.co.uk

Verified: 10 cottages listed (Pant Glas, Swn y Mor Deganwy, Eleven, Maes Glas,
Glan Lledr, Ty'r Efail, Orme View, Glain Orme, Dolphin House, White O Morn);
enquiry-based, no live availability or card payment; no third-party booking
engine detected. Companies House 09827850, active, incorporated 2015, Deganwy.

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
> Worth 15 minutes next week to see if it fits how you work? If a call's too much,
> say the word and I'll send a 2-minute video instead.
>
> Ali — founder, Propvian
> {{postal_address}} · Don't want to hear from me? Reply "stop" and I'll remove you.

---

## 2. Wayford Marine Ltd (Norfolk Holiday Accommodation) — enquiries@norfolkholidayaccommodation.co.uk

Verified: 6 properties (Beech Barn, Willow Barn, Alderfen Barn, Ferry Cottage,
Kings Lodge and one further); site says "book direct with us, the owners" but
offers no live availability or card payment; no booking engine detected.
Companies House 04193213, active, incorporated 2001.

> **Subject:** booking direct on norfolkholidayaccommodation.co.uk
>
> Hi,
>
> I was going through norfolkholidayaccommodation.co.uk — six places on the
> Broads, and you already tell guests to book direct with you, the owners. The
> bit that's missing is the mechanism: they still have to email you and wait,
> rather than see live availability and pay.
>
> That's the whole of what I built Propvian for. Your calendars from Airbnb and
> Booking.com feed a real booking page on your own domain, and guests pay you
> directly through your own Stripe account. No commission — ours or an OTA's.
>
> Worth 15 minutes next week to see if it fits how you work? If a call's too much,
> say the word and I'll send a 2-minute video instead.
>
> Ali — founder, Propvian
> {{postal_address}} · Don't want to hear from me? Reply "stop" and I'll remove you.

---

## Do not contact yet

- **Wales Cottages** (walescottages.com) — the booking form fails to load, which
  is the strongest weak-booking signal found so far, but the property count is
  unknown and no company match has been made. Both are required first.
- **Serviced Lettings** (stay@serviced-lettings.com) — 5 Edinburgh apartments and
  a generic mailbox, but no confident Companies House match. PECR needs the legal
  entity confirmed before a UK send.
- **Cottage Retreats** (cottageretreatspembs@gmail.com) — enquiry-only with no
  engine, but the mailbox is a Gmail rather than their own domain, the count is
  not stated, and no limited company was found. Likely a sole trader, whom PECR
  treats as an individual. Log in the `individuals` tab, do not email.
