import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2, XCircle } from 'lucide-react'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian — Airbnb Alternative for Direct Bookings',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Propvian is a direct booking platform for vacation rental hosts — an Airbnb alternative that lets you accept bookings commission-free on your own website.',
  url: 'https://propvian.com/airbnb-alternative',
}

export function AirbnbAlternativePage() {
  return (
    <>
      <SEOHead
        title="Airbnb Alternative: Accept Direct Bookings Without Commission"
        description="Tired of Airbnb fees? Propvian lets vacation rental hosts accept direct bookings on their own website — no OTA commission, no guest fee, full control. Free trial."
        canonical="/airbnb-alternative"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Airbnb Alternative</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Stop Paying Airbnb.<br />Own Your Direct Bookings.
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Propvian is the direct booking platform built for vacation rental hosts who are ready to reduce their dependency on Airbnb and OTAs. Get your own booking website, keep 100% of your revenue, and build a direct relationship with your guests.
            </p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-lg">
              Try Propvian Free
            </Link>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Airbnb vs. Direct Booking with Propvian</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-gray-500 font-semibold w-1/2">Feature</th>
                    <th className="text-center px-6 py-4 text-gray-500 font-semibold">Airbnb</th>
                    <th className="text-center px-6 py-4 text-primary-700 font-semibold">Propvian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    ['Host service fee', '3–5% per booking', '0% commission'],
                    ['Guest service fee', '14–20% added on top', 'No OTA guest fee'],
                    ['Your own website', 'No', 'Yes — custom domain'],
                    ['Guest data ownership', 'Airbnb owns it', 'You own it'],
                    ['Direct payment to host', 'Delayed 24hrs after check-in', 'Direct via Stripe/PayPal'],
                    ['Custom cancellation policy', 'Limited presets', 'Fully customizable'],
                    ['Control over pricing', 'Limited (smart pricing)', 'Full control'],
                    ['Host-guest relationship', 'Mediated by Airbnb', 'Direct'],
                    ['Account suspension risk', 'High (algorithm-based)', 'You control your platform'],
                  ].map(([feature, airbnb, propvian]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-700">{feature}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{airbnb}</td>
                      <td className="px-6 py-4 text-center text-primary-700 font-medium">{propvian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">Airbnb fees shown are approximate and may vary. Propvian is not affiliated with or endorsed by Airbnb.</p>
          </div>
        </section>

        {/* Why go direct */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Why Vacation Rental Hosts Choose Direct Bookings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Keep more of every booking',
                desc: 'Airbnb charges hosts 3–5% and guests up to 20%. With Propvian, you pay a flat monthly fee — not a cut of every reservation.',
              },
              {
                title: 'Own the guest relationship',
                desc: 'When guests book through your website, their contact details and booking history belong to you. Build a repeat guest list and reduce your OTA dependency over time.',
              },
              {
                title: 'Avoid OTA algorithm risks',
                desc: 'OTA search rankings and account visibility are controlled by the platform. Your own website is always available, always showing your property first.',
              },
              {
                title: 'Set your own rules',
                desc: 'You decide your cancellation policy, house rules, check-in process, and pricing. No OTA restrictions.',
              },
              {
                title: 'Get paid faster',
                desc: 'Propvian connects directly to Stripe and PayPal. Guests pay at booking and funds go straight to your account.',
              },
              {
                title: 'Build your brand',
                desc: 'Your website, your domain, your brand. Guests see your property — not a generic OTA listing competing with neighbors.',
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

        {/* What you get */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get with Propvian</h2>
            <div className="space-y-3">
              {[
                'Professional direct booking website — built in minutes, no code',
                'Real-time availability calendar with instant booking',
                'Stripe and PayPal payment integration — direct to your account',
                'Custom domain support (stayatmyplace.com)',
                'Automated booking confirmations and guest notifications',
                'Reservation management dashboard',
                'Promo codes and discount settings',
                'Mobile-optimized for guests booking on phones',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important note */}
        <section className="py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="bg-amber-50 rounded-xl p-5 text-sm text-amber-800 border border-amber-100">
            <p className="font-semibold mb-1">Direct booking and OTAs work together</p>
            <p>Most successful hosts use direct bookings alongside OTAs like Airbnb — not instead of them. Propvian helps you capture repeat guests and direct traffic while you continue using Airbnb where it makes sense. The goal is to grow your direct booking share over time, not to disappear from OTAs overnight.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Reduce Your Airbnb Dependency?</h2>
            <p className="text-primary-100 mb-8">Launch your direct booking website and start accepting commission-free reservations.</p>
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
              { to: '/booking-engine', label: 'Booking Engine' },
              { to: '/direct-booking-software', label: 'Direct Booking Software' },
              { to: '/integrations/airbnb', label: 'Airbnb Integration' },
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
