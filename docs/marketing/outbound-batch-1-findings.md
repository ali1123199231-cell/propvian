# Batch #1 — market test result (2026-08-20)

Nine professional operators were pulled from public search across the playbook's
own target regions (Cornwall, Lake District, Gatlinburg/Pigeon Forge, Asheville)
and checked against the four qualifiers in `outbound-batch-1.md`.

**Nine out of nine already have online booking, a dedicated PMS, or both.**
Raw data: `batch1-research-2026-08-20.csv`.

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
