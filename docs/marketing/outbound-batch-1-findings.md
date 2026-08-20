# Batch #1 — market test result (2026-08-20)

Nine professional operators were pulled from public search across the playbook's
own target regions (Cornwall, Lake District, Gatlinburg/Pigeon Forge, Asheville)
and checked against the four qualifiers in `outbound-batch-1.md`.

**Nine out of nine already have online booking, a dedicated PMS, or both.**

The sample was then widened to **19 operators**, which gives a fairer number:
**2 confirmed full qualifiers, 2 more probable, 15 disqualified — a hit rate of
roughly 10-20%, not zero.** The first nine were the most visible operators in
each region, and visibility was itself the bias. Raw data:
`batch1-research-2026-08-20.csv`.

| Operator | Market | What they already run |
|---|---|---|
| Host My Home | Cornwall | Guesty |
| Cornish Secrets | Cornwall | Anytime Booking |
| Forever Cornwall Ltd | Cornwall | SuperControl |
| Wheelwrights Cottages Ltd | Lake District | live availability + card payment |
| Cornish Collection Ltd | Cornwall | search form + owner portal |
| Aspects Holidays Ltd | Cornwall | owner portal subdomain |
| Heartland Cabin Rentals | Gatlinburg | Book on the Bright Side |
| Bear Camp Cabin Rentals | Pigeon Forge | own reservation engine |
| Carolina Mornings | Asheville | TrackHS |

Two of the US three publish no email address at all — only a phone number — so
they fail the generic-mailbox qualifier independently of the software question.

## The contradiction this exposes

The playbook set the bar at **5+ properties** because the unit economics demand it:
at $10/property/month a 3-property host is $30/month, which never repays
hand research. That reasoning is sound and unchanged.

But an operator large enough to clear that bar is, in a mature market, an operator
who bought booking software years ago. **The segment that can afford the outreach is
the segment that already has the product.** The qualifier "5+ properties *and* weak
at taking bookings" is close to an empty set in the UK and US.

This is made worse by a product fact: Propvian ships no channel manager (stated on
its own comparison pages, and a deliberate negative keyword in the ads plan). A
manager with 15 units across Airbnb, Booking.com and Vrbo needs one. So even a
qualifying lead would hit a real gap during the call.

## A methodological warning

Search ranking actively hides the qualifying lead. The operators who rank for
"holiday cottage letting agency Cornwall" rank *because* they invested in their web
presence — which is the same investment that bought them a booking engine. An
operator whose site is an enquiry form does not rank. Any list built by searching
will be biased toward companies that cannot qualify, which means the 13 hours the
playbook budgets would mostly produce disqualifications, exactly as the nine above did.

## Where the fit actually is

The inversion is worth stating plainly: the strongest product fit is the lead the
playbook explicitly excludes — **the host with listings but no website at all.**
"Your own direct booking website" is the entire pitch, and they have none. They were
ruled out as unreachable, not as a bad fit. They are reachable, just not by email:
they are reachable by search ads, SEO and host communities, which is where the
playbook itself concluded individual hosts must come from.

## What the wider sample changes

Qualifiers exist, but they sit at the **bottom** of the value range and cost far
more to find than the playbook assumed:

- **North Wales Holiday Cottages Ltd** (09827850) — 10 cottages counted around
  Deganwy and Conwy, enquiry-only, `info@` on their own domain, active Ltd.
- **Wayford Marine Ltd**, trading as Norfolk Holiday Accommodation (04193213) —
  6 named properties, "book direct with us, the owners" but no live availability,
  `enquiries@` on their own domain, active Ltd since 2001.

At 6-10 properties these are $60-100/month accounts, not the 15-unit managers the
economics were built around. And at a ~11% confirmed hit rate, a list of 30
qualified leads means assessing roughly 270 sites — so the playbook's "15
qualified leads/hour" is optimistic by something like 5x. Realistic rate is 2-3/hour.

Two more are close but must not be contacted yet: **Wales Cottages** (booking form
literally fails to load — the playbook's `broken_widget` case) needs a property
count and a Companies House match, and **Serviced Lettings** has no confident
company match, which PECR requires before a UK send.

## Recommendation

Do not spend the 13 hours on batch #1 as specified. Either:

1. **Redirect the effort to paid search**, which as of today is measurable for the
   first time (see below), or
2. **Re-cut the ICP** to operators with 5+ units who are *visibly new* — recently
   incorporated, listings live but site not yet built — and accept a much lower
   find rate per hour, or
3. **Run batch #1 at n=30 rather than 200** purely to hear objections in the
   operators' own words, which was the stated purpose anyway, and stop there.

## Related: measurement was broken until today

Whatever channel is chosen, three faults were fixed on 2026-08-20 that would have
made any spend unmeasurable — the CSP blocked every Google Ads conversion beacon,
`captureAttribution()` was never called in production so `users.gclid` was never
populated, and the landing page opened on a sign-in form for visitors with no
account. See commits `dd80470` and `0c44ccd`.


---

# Final tally — 63 operators researched (2026-08-20)

Full data in `batch1-leads.csv`, tiered. Discovery used sanctioned search plus a
robots.txt-respecting pre-filter; sites that refuse automated access were skipped,
not worked around.

| Tier | Count | Meaning |
|---|---|---|
| A | 4 | Every qualifier met **and** an active Ltd confirmed at Companies House — sendable today |
| B | 12 | Passes the cheap filter but is JavaScript-rendered or blocks bots; needs a human to look |
| C | 5 | Qualifies operationally but **must not be emailed** — not incorporated, or no business mailbox |
| D | 42 | Disqualified, overwhelmingly because they already run booking software |

## Two filters compound, and the second one was the surprise

**67% (42/63) already run a booking engine or sell online.** SuperControl alone
accounts for a dozen; then Guesty, Freetobook, Guestline, STAAH, Synxis, TrackHS,
Bookalet, Elina, RMS Cloud, Hostaway, Anytime Booking, Book on the Bright Side.

**Of the operators that survive that filter, roughly half are not limited
companies at all.** Tenby Town Cottages (8 cottages), Isle of Mull Holidays
(8 cottages) and Cottage Retreats all qualify on every operational test and all
had to be moved to "do not email", because PECR treats a sole trader as an
individual and unsolicited B2B email to them is not lawful without consent.

That second filter was not anticipated in the original playbook, and it is what
makes the ICP genuinely thin: **the small, un-tooled operator that needs Propvian
most is disproportionately the one that never incorporated.**

## What 30 sendable leads would actually cost

Measured Tier A rate is **4 in 63, about 6%**. If the 12 unresolved Tier B leads
convert at the same A:C ratio observed so far, they would yield perhaps 5 more,
lifting the effective rate to roughly 14%. Either way, **30 sendable leads means
assessing somewhere between 210 and 500 operator websites.** The playbook budgeted
13 hours for 200 leads at "15 qualified leads/hour". The real rate is closer to
**1-2 qualified leads per hour**, and a large share of that time is spent on sites
that block automated access and must be opened by hand.
