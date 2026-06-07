import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2 } from 'lucide-react'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian Vacation Rental Booking Engine',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Propvian is a vacation rental booking engine that lets hosts accept direct bookings on their own website with real-time availability, pricing, and Stripe/PayPal checkout.',
  url: 'https://propvian.com/booking-engine',
}

export function BookingEnginePage() {
  return (
    <>
      <SEOHead
        title="Vacation Rental Booking Engine"
        description="Propvian's vacation rental booking engine gives hosts a real-time availability calendar, instant booking checkout, Stripe and PayPal payments, and automated guest confirmations."
        canonical="/booking-engine"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Vacation Rental Booking Engine</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              A Booking Engine Built for Vacation Rental Hosts
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Propvian's booking engine powers your direct booking website with real-time availability, instant checkout, Stripe and PayPal payment processing, and automated guest communication — all embedded in your own property website.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Start Free Trial
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Booking engine features */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">How the Booking Engine Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                step: '1',
                title: 'Guest searches availability',
                desc: 'The real-time calendar shows exactly which dates are available, blocked, or under minimum stay requirements. No stale data, no double bookings.',
              },
              {
                step: '2',
                title: 'Guest selects dates and sees pricing',
                desc: 'Your nightly rate, cleaning fees, minimum stay rules, and discounts are applied automatically. Guests see the full cost breakdown before paying.',
              },
              {
                step: '3',
                title: 'Guest completes checkout',
                desc: 'A clean, mobile-optimized checkout collects guest details and processes payment via Stripe or PayPal. The booking is confirmed instantly.',
              },
              {
                step: '4',
                title: 'Host and guest receive confirmation',
                desc: 'Both you and the guest receive automated email confirmations. The reservation appears in your dashboard immediately.',
              },
              {
                step: '5',
                title: 'Calendar updates in real time',
                desc: 'Booked dates are blocked immediately. No manual availability management needed.',
              },
              {
                step: '6',
                title: 'Funds deposited to your account',
                desc: 'Payment goes directly from the guest to your Stripe or PayPal account. Propvian never holds your money.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">{step}</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical capabilities */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Booking Engine Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Real-time availability', desc: 'Calendar reflects bookings instantly — no sync delay, no double booking risk.' },
                { title: 'Flexible pricing rules', desc: 'Set base nightly rates, weekend rates, seasonal pricing, and minimum stay requirements.' },
                { title: 'Instant or inquiry-first booking', desc: 'Choose between instant booking (guest pays immediately) or inquiry-first (you approve before payment).' },
                { title: 'Cleaning fee and extra fees', desc: 'Add cleaning fees, security deposits, and custom charges that auto-apply to every booking.' },
                { title: 'Promo codes', desc: 'Issue discount codes for returning guests, direct guests, or marketing campaigns.' },
                { title: 'Buffer days', desc: 'Automatically block days before and after each booking for preparation and cleaning.' },
                { title: 'Hold/block dates', desc: 'Manually block dates for personal stays, maintenance, or off-season closures.' },
                { title: 'Stripe and PayPal', desc: 'Guests can pay by card (Stripe) or PayPal. You choose which payment methods to accept.' },
                { title: 'Automated confirmations', desc: 'Guests receive instant booking confirmation emails. No manual follow-up needed.' },
                { title: 'Mobile-first checkout', desc: 'The checkout is optimized for mobile. Most guests book from their phones.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Direct Payment Processing</h2>
          <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 space-y-4">
            <p>Propvian's booking engine uses <strong>Stripe Connect</strong> to process guest payments directly into your Stripe account. No intermediary, no delayed payouts, no Propvian handling your money.</p>
            <p>Optionally connect <strong>PayPal</strong> for guests who prefer to pay via PayPal.</p>
            <p>Propvian is not the merchant of record. All payments are between the guest and you — Propvian is software infrastructure that facilitates the connection.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Add a Booking Engine to Your Property Website</h2>
            <p className="text-primary-100 mb-8">Free trial — no credit card needed. Live booking engine in under 30 minutes.</p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <p className="text-sm font-semibold text-gray-900 mb-4">Related</p>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/direct-booking-website', label: 'Direct Booking Website' },
              { to: '/vacation-rental-website-builder', label: 'Website Builder' },
              { to: '/airbnb-alternative', label: 'Airbnb Alternative' },
              { to: '/direct-booking-software', label: 'Direct Booking Software' },
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
