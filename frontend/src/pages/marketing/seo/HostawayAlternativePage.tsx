import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2, XCircle } from 'lucide-react'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian — Hostaway Alternative for Independent Hosts',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Propvian is a Hostaway alternative for independent vacation rental hosts: a no-code direct booking website with a flat $10/month-per-property price and no sales call.',
  url: 'https://propvian.com/hostaway-alternative',
}

export function HostawayAlternativePage() {
  return (
    <>
      <SEOHead
        title="Hostaway Alternative for Independent Hosts"
        description="Looking for a Hostaway alternative? Propvian is a no-code direct booking website for solo hosts with 1–15 rentals — flat $10/month per property, no sales call, no quote."
        canonical="/hostaway-alternative"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Hostaway Alternative</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              A Hostaway Alternative <br />for Hosts, Not Portfolios
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              You have two cabins and a spare condo, you went to look at Hostaway, and you ended up in a demo call about owner reporting and multi-unit task automation. That is a property management system built for companies running dozens of units. If you are an individual host who just wants a direct booking website you can see the price of and set up in an afternoon, Propvian is built for you instead.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-lg">
                Start Free 30-Day Trial
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl border border-primary-200 hover:bg-primary-50 transition-colors text-lg">
                See Pricing
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">No credit card required.</p>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Propvian vs. Hostaway at a Glance</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-gray-500 font-semibold w-1/3">Feature</th>
                    <th className="text-center px-6 py-4 text-primary-700 font-semibold">Propvian</th>
                    <th className="text-center px-6 py-4 text-gray-500 font-semibold">Hostaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    ['Pricing model', 'Self-serve flat $10/mo per active property', 'Quote-based, historically scales with unit count'],
                    ['See price before signing up', 'Yes, published and self-serve', 'Typically requires a sales call or quote'],
                    ['Built for', 'Solo hosts and small operators (1–15 rentals)', 'Property management companies and larger portfolios'],
                    ['Channel manager (two-way OTA sync)', 'No — one-way iCal import only', 'Yes — multi-channel distribution'],
                    ['Calendar sync direction', 'Pulls bookings in from Airbnb / Booking.com', 'Pushes and pulls across many OTAs'],
                    ['Setup time', 'An afternoon, no code', 'Onboarding process oriented to larger accounts'],
                    ['Custom domain', 'Yes, with guided DNS setup', 'Available within its broader platform'],
                    ['Payment processor control', 'Your own Stripe / PayPal — funds go to you', 'Configured within the PMS'],
                    ['Owner / multi-owner reporting', 'No', 'Yes'],
                    ['Cleaning & maintenance task automation', 'No', 'Yes'],
                    ['Onboarding', 'Sign up yourself, no sales call', 'Sales-assisted onboarding'],
                  ].map(([feature, propvian, hostaway]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-700">{feature}</td>
                      <td className="px-6 py-4 text-center text-primary-700 font-medium">{propvian}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{hostaway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Pricing and feature information reflects general positioning as of this article&apos;s writing and may have changed. Propvian is not affiliated with or endorsed by Hostaway. Check Hostaway&apos;s site for current pricing and features.
            </p>
          </div>
        </section>

        {/* Why hosts look for an alternative */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Why an Individual Host Looks Past Hostaway</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto text-sm">
            Hostaway is good at what it does. The mismatch is usually about who it was designed for.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "You're a host, not a management company",
                desc: "Owner statements, multi-owner trust accounting, and crew dispatch tools are real features, but they are answers to problems you do not have when the two properties are both yours.",
              },
              {
                title: 'You want to see the price yourself',
                desc: "Booking a call to find out what software costs is a friction point. Propvian publishes a flat $10/month per active property and lets you sign up without talking to anyone.",
              },
              {
                title: 'You want to be live this week',
                desc: "An onboarding process tuned for a company adding fifty units is overkill for getting one cabin online. With Propvian you pick a template, add your photos and rates, and publish the same afternoon.",
              },
              {
                title: "You're paying for capacity you won't use",
                desc: "Pricing that scales with units under management makes sense for a growing agency. For a host with a handful of personal rentals, most of that capability sits unused.",
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

        {/* Where Hostaway is still better */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Where Hostaway Is Still the Better Choice</h2>
            <p className="text-gray-600 mb-8 text-sm">
              We would rather you pick the right tool than churn in a month. If the description below fits you, Propvian is not a replacement for Hostaway, and you should stay where the heavier features are doing real work.
            </p>
            <div className="space-y-4">
              {[
                "You run a property management company with units across multiple owners, and you need per-owner reporting and payouts.",
                "You depend on two-way channel management to keep availability synced across many OTAs at once — Propvian only imports availability one way and has no channel manager.",
                "Your operation runs on cleaning, maintenance, and check-in task automation across a team. Propvian does not have task or crew workflows.",
                "You are scaling toward dozens of units and want a single PMS to grow into. That is the job Hostaway is built for, and Propvian does not try to replicate it.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-8 text-sm">
              Propvian sits at the other end of the market: independent hosts and small operators, roughly one to fifteen properties, who want their own direct booking site rather than a full management platform.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get with Propvian</h2>
          <div className="space-y-3">
            {[
              'No-code drag-and-drop website builder — 16+ section types and 6 starter templates',
              'Mobile-responsive design with custom domain support and guided DNS setup',
              'Real-time availability calendar with holds, buffer days, and seasonal pricing rules',
              'Database-level overlap protection — two bookings cannot land on the same dates',
              'One-way iCal sync from Airbnb and Booking.com, refreshed every 15 minutes',
              'Direct Stripe and PayPal checkout — guest payments go straight to your account',
              'Flat $10/month per active property, no commission on bookings',
              'Automated booking confirmation emails and a guest messaging inbox',
              'Multi-property dashboard, promo codes, and basic analytics',
              'HTTPS-encrypted, GDPR-aware data handling',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Optional add-on: TTLock smart-lock integration for self-check-in door codes at $2/lock per month. Not part of the booking website itself.
          </p>
        </section>

        {/* Honest caveat */}
        <section className="py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="bg-amber-50 rounded-xl p-5 text-sm text-amber-800 border border-amber-100">
            <p className="font-semibold mb-1">The honest limitation: calendar sync is one-way</p>
            <p className="mb-3">
              Propvian pulls availability in from Airbnb and Booking.com via iCal so a direct booking cannot double-book a date that is already reserved on those platforms. It does not push your Propvian bookings back out to the OTAs. If you take a direct booking on Propvian, you still need to block those dates on Airbnb and Booking.com yourself. There is no channel manager and no two-way sync.
            </p>
            <p>
              Propvian also has no multi-owner reporting or owner payouts. If you manage units on behalf of other owners and need to report to them, that is a gap you should weigh before switching.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Hostaway Alternative FAQ</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Do I need a sales call to see what Propvian costs?',
                  a: "No. Pricing is published and self-serve: a flat $10 per month for each active property, with no commission on bookings. You can see it, sign up, and start a 30-day free trial without talking to anyone. That is one of the main differences from Hostaway, whose pricing has historically been quote-based.",
                },
                {
                  q: 'Does Propvian have cleaning or task automation like Hostaway?',
                  a: "No. Propvian does not include cleaning, maintenance, or crew task workflows. Those are part of why Hostaway exists for management companies. Propvian focuses on the direct booking website, calendar, and payments rather than operations tooling for a team.",
                },
                {
                  q: 'Is Propvian built for property management companies?',
                  a: "No, and we say so plainly. Propvian is built for independent hosts and small operators, roughly one to fifteen properties. If you manage many units across multiple owners and need owner reporting and multi-channel distribution, Hostaway is the better fit and Propvian will not replace it.",
                },
                {
                  q: 'Can a solo host with two properties realistically use Propvian instead of Hostaway?',
                  a: "Yes — that is exactly the host Propvian is designed for. You get a booking website, a real-time calendar with overlap protection, and direct Stripe or PayPal payments at a flat $10 per property per month. The trade-off is no channel manager, so you manage OTA availability alongside it rather than through it.",
                },
                {
                  q: 'Will switching to Propvian stop my Airbnb and Booking.com listings from double-booking?',
                  a: "Partially. Propvian imports those calendars one way every 15 minutes, so its calendar respects dates already booked on Airbnb and Booking.com. It does not push direct bookings back out, so when you take a booking on Propvian you need to block those dates on the OTAs yourself. There is no two-way sync.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-xl p-5 border border-gray-100">
                  <p className="font-semibold text-gray-900 mb-2">{q}</p>
                  <p className="text-sm text-gray-600">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Built for Your Rentals, Priced for One Person</h2>
            <p className="text-primary-100 mb-8">Pick a template, add your photos and rates, and publish your direct booking site this afternoon. Flat $10/month per property, free for 30 days, no credit card.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
                Start Free Trial
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-8 py-3 bg-primary-500 text-white font-bold rounded-xl border border-primary-400 hover:bg-primary-700 transition-colors">
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
              { to: '/pricing', label: 'Pricing' },
              { to: '/lodgify-alternative', label: 'Lodgify Alternative' },
              { to: '/guesty-alternative', label: 'Guesty Alternative' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors">
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
