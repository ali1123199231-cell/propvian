import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2, XCircle } from 'lucide-react'

const comparison: [string, string, string][] = [
  ['Pricing model', 'Quote-based, enterprise-oriented', 'Flat $10/mo per active property, self-serve'],
  ['Commission on bookings', 'No per-booking commission (PMS model)', 'No commission — flat fee only'],
  ['Channel manager / multi-OTA sync', 'Two-way channel management across many OTAs', 'One-way iCal pull from Airbnb & Booking.com only'],
  ['Best-fit customer', 'Management companies, dozens to hundreds of units', 'Solo hosts and small operators, ~1–15 properties'],
  ['Setup time', 'Onboarding and configuration for portfolio scale', 'Live in an afternoon, no code'],
  ['Custom domain', 'Supported', 'Supported with guided DNS setup'],
  ['Payment processor control', 'Platform-managed flows', 'Your own Stripe/PayPal — funds go straight to you'],
  ['Team & owner permissions', 'Built for teams and multi-owner reporting', 'Single-operator dashboard, no owner portals'],
  ['See pricing before talking to anyone', 'Typically requires a quote or demo', 'Yes — price is public, sign up directly'],
]

const reasons = [
  {
    title: 'The pricing model assumes a portfolio',
    desc: 'Guesty is historically quote-based and positioned for scale. If you run one or two listings, getting on a sales call to price out an enterprise PMS feels disproportionate to the problem you actually have.',
  },
  {
    title: 'You are paying for depth you will never touch',
    desc: 'Multi-owner reporting, team role permissions, and a large integrations marketplace are real capabilities — but they solve problems a small host does not have. You want a booking website, not an operations platform.',
  },
  {
    title: 'You just want direct bookings off your own site',
    desc: 'Many hosts who look at Guesty actually want one thing: a clean, branded site that takes reservations and payments without OTA commission. That is a narrower job than what a full PMS is built to do.',
  },
  {
    title: 'Onboarding is heavier than the job calls for',
    desc: 'Configuring an enterprise PMS for portfolio operations is more setup than a host with a handful of properties needs. A no-code builder you can launch the same day is a closer match.',
  },
]

const features = [
  'No-code drag-and-drop website builder — 16+ section types, 6 starter templates',
  'Custom domain support with guided DNS setup',
  'Real-time availability calendar with holds, buffer days, and seasonal pricing',
  'Database-level exclusion constraint — two bookings literally cannot overlap',
  'One-way iCal sync from Airbnb and Booking.com, refreshed every 15 minutes',
  'Direct Stripe and PayPal checkout — funds go to your own connected account',
  'Flat $10/month per active property, no commission on bookings',
  'Automated booking confirmation emails and a guest messaging inbox',
  'Multi-property dashboard, promo codes, and basic analytics',
  'HTTPS / encrypted data, GDPR-aware',
]

const faqs = [
  {
    q: 'Is Propvian a Guesty competitor, or is it a different kind of tool?',
    a: 'It is a different kind of tool aimed at a different customer. Guesty is a full property management system built for professional operators running large portfolios. Propvian is a direct booking website builder for individual hosts and small operators. If you need enterprise channel management and team operations, Propvian is not a replacement. If you mainly want a branded booking site that takes payments, it likely covers what you need.',
  },
  {
    q: 'Do I need a demo call to see Propvian pricing?',
    a: 'No. Pricing is public and self-serve: a flat $10 per month per active property, billed only while a property is active, with no commission on bookings. You can see the price and start a free 30-day trial without talking to sales or entering a card.',
  },
  {
    q: 'Can a host with a handful of properties realistically use Propvian instead of Guesty?',
    a: 'Yes — that is exactly who it is built for, roughly the 1 to 15 property range. The honest caveat is the calendar sync: Propvian pulls availability one way from Airbnb and Booking.com so direct bookings cannot double-book an OTA reservation, but it does not push your availability back out. If you depend on two-way channel management across many OTAs, you need a full PMS like Guesty.',
  },
  {
    q: 'Does Propvian have an integrations marketplace?',
    a: 'No. Propvian deliberately keeps a small, direct set of integrations: Stripe and PayPal for payments, one-way iCal sync from Airbnb and Booking.com, and an optional TTLock smart-lock add-on for self-check-in codes. There is no broad app marketplace like Guesty offers. That is part of the trade-off for a simpler, cheaper, self-serve tool.',
  },
  {
    q: 'Will I lose my Airbnb and Booking.com listings if I switch?',
    a: 'No. Propvian is not a replacement for your OTA listings — it sits alongside them. You keep your Airbnb and Booking.com accounts, and Propvian reads their calendars so your direct-booking site stays in sync one way. Most small hosts use direct bookings to grow their commission-free share over time, not to leave OTAs entirely.',
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian — Guesty Alternative for Independent Hosts',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Propvian is a Guesty alternative for solo hosts and small short-term rental operators — a no-code direct booking website builder with a flat, commission-free price.',
  url: 'https://propvian.com/guesty-alternative',
}

export function GuestyAlternativePage() {
  return (
    <>
      <SEOHead
        title="Guesty Alternative for Small Hosts | Direct Bookings"
        description="Looking for a Guesty alternative sized for one to fifteen properties? Propvian is a no-code direct booking website builder with a flat, commission-free price. Free trial."
        canonical="/guesty-alternative"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Guesty Alternative</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              A Guesty Alternative Sized for Your Handful of Properties
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              You looked at Guesty because it is one of the biggest names in short-term rental software, then realized it is built for management companies running dozens or hundreds of units. If you host one to fifteen properties and mainly want a branded site that takes direct bookings, Propvian is the proportionate option: no-code, self-serve, and priced as a flat monthly fee instead of a quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-lg">
                Start Free Trial
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                See Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Propvian vs. Guesty at a Glance</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-gray-500 font-semibold w-1/3">Feature</th>
                    <th className="text-center px-6 py-4 text-gray-500 font-semibold">Guesty</th>
                    <th className="text-center px-6 py-4 text-primary-700 font-semibold">Propvian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {comparison.map(([feature, guesty, propvian]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-700">{feature}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{guesty}</td>
                      <td className="px-6 py-4 text-center text-primary-700 font-medium">{propvian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Comparison reflects general positioning as of this article&apos;s writing and may have changed. Guesty pricing is historically quote-based and not published as a flat figure — check Guesty&apos;s site for current numbers. Propvian is not affiliated with or endorsed by Guesty.
            </p>
          </div>
        </section>

        {/* Why hosts look for an alternative */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Why Individual Hosts Look Past Guesty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map(({ title, desc }) => (
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

        {/* Where Guesty is still better */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Where Guesty Is Still the Better Choice</h2>
            <p className="text-gray-600 mb-6">
              This is not a one-size-fits-all decision, and Propvian is not the right tool for everyone. If you run a hospitality management business — a large multi-property, multi-owner portfolio — Guesty is doing real work that Propvian does not replicate. Stay with the full PMS if you need:
            </p>
            <div className="space-y-3">
              {[
                'Two-way channel management that pushes availability and rates across many OTAs',
                'Team role permissions for staff, cleaners, and coordinators',
                'Owner portals and per-owner reporting for properties you manage on behalf of others',
                'A broad integrations marketplace to plug into a wider operations stack',
                'Workflows and automation designed for managing dozens to hundreds of units',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-6">
              If that list describes your business, a full PMS earns its cost. Propvian is built for the host running a handful of properties — not for replacing portfolio-scale management software.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get with Propvian</h2>
          <div className="space-y-3">
            {features.map((item) => (
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
            <p className="font-semibold mb-1">Read this before you switch</p>
            <p className="mb-3">
              Propvian&apos;s calendar sync is one way only. It pulls bookings from Airbnb and Booking.com every 15 minutes and blocks those dates on your Propvian site, so a direct booking can never double-book an OTA reservation. It does not push your Propvian availability back out to those platforms — there is no two-way sync and no channel manager. If you rely on a tool to keep many OTA listings in lockstep, that is exactly what a full PMS like Guesty provides and Propvian does not.
            </p>
            <p>
              Propvian also has no enterprise team or owner-permission features — no staff roles, no owner portals, no per-owner reporting. It is a single-operator tool by design. If those features matter to your business, Propvian is not the right fit.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-6">
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
            <h2 className="text-2xl font-bold text-white mb-4">Want Direct Bookings Without the Enterprise Overhead?</h2>
            <p className="text-primary-100 mb-8">Launch a branded booking website in an afternoon. Flat pricing, no commission, no sales call required.</p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
              Start Your Free Trial
            </Link>
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
              { to: '/lodgify-alternative', label: 'Lodgify Alternative' },
              { to: '/hostaway-alternative', label: 'Hostaway Alternative' },
              { to: '/pricing', label: 'Pricing' },
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
