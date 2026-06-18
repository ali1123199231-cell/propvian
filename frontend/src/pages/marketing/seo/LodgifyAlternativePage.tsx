import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2, XCircle } from 'lucide-react'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian — Lodgify Alternative for Direct Booking Websites',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Propvian is a flat-fee, no-code direct booking website builder for independent vacation rental hosts — a simpler Lodgify alternative for small short-term rental portfolios.',
  url: 'https://propvian.com/lodgify-alternative',
}

export function LodgifyAlternativePage() {
  return (
    <>
      <SEOHead
        title="Lodgify Alternative: Flat-Fee Direct Booking Sites"
        description="Looking for a Lodgify alternative? Propvian builds no-code direct booking websites for small vacation rental hosts at a flat $10/month per property, no commission. Free trial."
        canonical="/lodgify-alternative"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Lodgify Alternative</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              A Simpler Lodgify Alternative <br />for Hosts with a Handful of Rentals
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              If you run one to fifteen short-term rentals and you keep landing on Lodgify pricing tiers built for bigger
              portfolios, this page is for you. Propvian is a no-code direct booking website builder with flat per-property
              pricing and no commission. There is one tradeoff worth knowing up front: Propvian does not have a two-way
              channel manager. If syncing rates across several OTAs is the job you need done, Lodgify is the better fit, and
              we say so below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-lg"
              >
                Start Free 30-Day Trial
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl border border-primary-200 hover:bg-primary-50 transition-colors text-lg"
              >
                See Pricing
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">No credit card required.</p>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Propvian vs. Lodgify at a Glance</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-gray-500 font-semibold w-1/3">Feature</th>
                    <th className="text-center px-6 py-4 text-primary-700 font-semibold">Propvian</th>
                    <th className="text-center px-6 py-4 text-gray-500 font-semibold">Lodgify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    [
                      'Pricing model',
                      'Flat $10/month per active property',
                      'Tiered by property count (check current plans)',
                    ],
                    [
                      'Channel manager / two-way OTA sync',
                      'No — one-way iCal pull only',
                      'Yes — two-way sync across multiple OTAs',
                    ],
                    [
                      'Commission per booking',
                      '0% — never a cut of a reservation',
                      'No booking commission on most plans',
                    ],
                    [
                      'Built for',
                      'Independent hosts, ~1–15 properties',
                      'Solo hosts up to larger multi-OTA portfolios',
                    ],
                    [
                      'Setup time',
                      'Minutes — pick a template, publish',
                      'Longer — more setup for channel sync',
                    ],
                    [
                      'Custom domain',
                      'Yes — guided DNS setup',
                      'Yes',
                    ],
                    [
                      'Payment processor control',
                      'Your own Stripe / PayPal, funds direct to you',
                      'Connected payment processors supported',
                    ],
                    [
                      'No-code website builder',
                      'Yes — 16+ sections, 6 templates',
                      'Yes — template-based builder',
                    ],
                  ].map(([feature, propvian, lodgify]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-700">{feature}</td>
                      <td className="px-6 py-4 text-center text-primary-700 font-medium">{propvian}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{lodgify}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Comparison reflects general positioning as of this article&apos;s writing and may have changed. Lodgify pricing
              is historically tiered by property count, with full channel-manager functionality often on higher tiers — check
              Lodgify&apos;s current pricing page for exact figures. Propvian is not affiliated with or endorsed by Lodgify.
            </p>
          </div>
        </section>

        {/* Why look for an alternative */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Why Hosts Look for a Lodgify Alternative</h2>
          <p className="text-gray-600 mb-10 text-center max-w-2xl mx-auto">
            Lodgify is a capable product. The reasons people shop around usually come down to scale and how they bill, not
            quality.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "You don't actually need a channel manager",
                desc: "If you only have one or two OTA listings and you are comfortable updating them by hand, a two-way channel manager is paying for a job you are not asking it to do. The website builder is the part you wanted.",
              },
              {
                title: 'Tiered pricing outgrows the value',
                desc: "Plans tiered by property count, with channel sync gated to higher tiers, can cost more than a small portfolio justifies. Hosts with three or four rentals often want predictable, flat per-property billing instead.",
              },
              {
                title: 'You want flat pricing with zero commission',
                desc: 'Propvian is a flat $10/month per active property, billed only while the property is live, and never takes a percentage of a booking. On a $1,500/month rental, an OTA fee of 3–15% would be $45–225/month versus $10 here.',
              },
              {
                title: 'You want a faster path to a live site',
                desc: 'Skipping channel configuration means you can pick a template, drop in your photos and rates, connect Stripe, and publish on your own domain in an afternoon.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Where Lodgify wins */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Where Lodgify Is Still the Better Choice</h2>
            <p className="text-gray-600 mb-8 text-center">
              This is the honest part. There is a real scenario where you should not switch.
            </p>
            <div className="space-y-4">
              {[
                "You actively manage rates and availability across several OTAs at once — say Airbnb, Vrbo, and Booking.com — and you rely on changing a price or closing a date in one place and having it propagate everywhere.",
                "You need two-way sync so a booking on any channel instantly closes the dates on every other channel. Propvian only pulls one-way from Airbnb and Booking.com to block its own calendar; it does not push availability back out.",
                "You treat OTAs as your primary distribution and a direct website as secondary. A channel manager is doing genuine, valuable work in that setup, and Propvian does not replicate it.",
              ].map((line) => (
                <div key={line} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{line}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-6 text-center">
              If that describes you, Lodgify&apos;s channel manager earns its keep. Propvian is the right move when the direct
              website is the goal and OTA management is light or something you are happy to handle manually.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get with Propvian</h2>
          <div className="space-y-3">
            {[
              'No-code drag-and-drop builder — 16+ section types and 6 starter templates',
              'Mobile-responsive design with custom domain support and guided DNS setup',
              'Real-time availability calendar with a hold system and buffer days between stays',
              'Seasonal pricing rules and a database-level guard so two bookings cannot overlap',
              'One-way iCal sync from Airbnb and Booking.com, refreshed every 15 minutes',
              'Direct Stripe and PayPal checkout — guest funds go straight to your account',
              'Automated booking confirmation emails and a guest messaging inbox',
              'Multi-property dashboard, promo codes, and basic analytics',
              'HTTPS-encrypted, GDPR-aware data handling',
              'Optional TTLock smart-lock add-on for self-check-in codes ($2/lock/month)',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Honest caveat */}
        <section className="py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="bg-amber-50 rounded-xl p-5 text-sm text-amber-800 border border-amber-100">
            <p className="font-semibold mb-1">About the calendar sync — read this before switching</p>
            <p>
              Propvian&apos;s OTA sync is one-way. It pulls iCal feeds from Airbnb and Booking.com every 15 minutes and blocks
              those dates on your Propvian calendar, so a direct booking can&apos;t double-book a reservation you already have on
              an OTA. It does not push your Propvian availability back to Airbnb or Booking.com, and there is no channel
              manager. If a guest books directly on your Propvian site, you still need to block those dates on your OTA
              listings yourself. For hosts with one or two OTA listings that is a quick manual step; for anyone juggling many
              channels at once, it is the reason to stay on a tool with two-way sync.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Lodgify vs. Propvian: Common Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Does Propvian have a channel manager like Lodgify?',
                  a: "No. This is the clearest difference between the two. Propvian pulls availability one-way from Airbnb and Booking.com to block its own calendar, but it does not push rates or availability out to OTAs and has no two-way channel sync. If multi-channel distribution is central to how you operate, stay with Lodgify.",
                },
                {
                  q: 'Can I import my Lodgify website into Propvian?',
                  a: "There is no automatic import of a Lodgify site. You rebuild on Propvian using one of the six starter templates and the drag-and-drop builder, then bring over your photos, descriptions, rates, and rules. Most small hosts find this takes an afternoon rather than days, since the templates handle the layout.",
                },
                {
                  q: 'Is Propvian cheaper than Lodgify?',
                  a: "For a small number of properties, usually yes. Propvian is a flat $10/month per active property with no booking commission. Lodgify is historically tiered by property count with channel-manager features often on higher tiers. Exact savings depend on Lodgify's current plans and how many rentals you run, so compare against Lodgify's live pricing page.",
                },
                {
                  q: 'Do I need to cancel Lodgify before switching?',
                  a: "No, and we'd suggest not rushing it. Build and publish your Propvian site first, take a few direct bookings, and confirm everything works for your setup. Only cancel Lodgify once you're confident you don't need its channel manager. Running both briefly during the transition is the safe approach.",
                },
                {
                  q: 'What happens to bookings already on the OTAs?',
                  a: "Propvian's one-way iCal sync blocks those dates on your Propvian calendar automatically, so direct bookings won't land on top of existing OTA reservations. The reverse is not automatic: a direct Propvian booking needs to be blocked on your OTA listings manually.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-lg border border-gray-100 p-5">
                  <p className="font-semibold text-gray-900 text-sm mb-2">{q}</p>
                  <p className="text-sm text-gray-600">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Try Propvian Free for 30 Days</h2>
            <p className="text-primary-100 mb-8">
              Build a direct booking website for your rentals, connect your own Stripe or PayPal, and keep every dollar of
              every booking. No credit card to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-700 text-white font-bold rounded-xl border border-primary-400 hover:bg-primary-800 transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <p className="text-sm font-semibold text-gray-900 mb-4">Related</p>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/direct-booking-website', label: 'Direct Booking Website' },
              { to: '/direct-booking-software', label: 'Direct Booking Software' },
              { to: '/vacation-rental-website-builder', label: 'Vacation Rental Website Builder' },
              { to: '/airbnb-alternative', label: 'Airbnb Alternative' },
              { to: '/hostaway-alternative', label: 'Hostaway Alternative' },
              { to: '/guesty-alternative', label: 'Guesty Alternative' },
              { to: '/pricing', label: 'Pricing' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  )
}
