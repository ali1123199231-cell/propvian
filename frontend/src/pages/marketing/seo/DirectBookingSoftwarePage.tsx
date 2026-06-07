import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2 } from 'lucide-react'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian Direct Booking Software',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Direct booking software for vacation rental hosts. Manage bookings, payments, guests, calendar, and website — all in one place.',
  url: 'https://propvian.com/direct-booking-software',
}

export function DirectBookingSoftwarePage() {
  return (
    <>
      <SEOHead
        title="Direct Booking Software for Vacation Rental Hosts"
        description="Propvian is complete direct booking software for vacation rental hosts. Manage bookings, payments, availability, guests, and your booking website — all in one platform."
        canonical="/direct-booking-software"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Direct Booking Software</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              All-in-One Direct Booking Software for Vacation Rental Hosts
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Propvian gives vacation rental hosts everything needed to run a direct booking operation: a booking website, payment processing, availability calendar, guest management, and reservations — all in one platform.
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

        {/* Feature modules */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">One Platform, Complete Control</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                emoji: '🌐',
                title: 'Booking Website',
                desc: 'No-code website builder with professional templates. Launch a complete booking site with calendar, checkout, and payments.',
              },
              {
                emoji: '📅',
                title: 'Availability Calendar',
                desc: 'Visual calendar with real-time availability, hold dates, buffer days, and seasonal pricing rules.',
              },
              {
                emoji: '💳',
                title: 'Payment Processing',
                desc: 'Direct Stripe and PayPal integration. Guests pay at checkout. Funds go straight to your account — no middleman.',
              },
              {
                emoji: '📋',
                title: 'Reservations',
                desc: 'Full reservation management — guest details, booking status, check-in/out tracking, and communication history.',
              },
              {
                emoji: '💬',
                title: 'Guest Messaging',
                desc: 'Centralized inbox for all guest communications. Automated booking confirmations, check-in instructions, and follow-ups.',
              },
              {
                emoji: '🔗',
                title: 'Custom Domain',
                desc: 'Connect your own domain name. Your booking website looks like your brand — not a SaaS tool.',
              },
              {
                emoji: '📊',
                title: 'Analytics',
                desc: 'Track booking performance, revenue, occupancy rates, and guest metrics across your properties.',
              },
              {
                emoji: '🏡',
                title: 'Multi-Property',
                desc: 'Manage multiple properties under one account. Each property gets its own booking page and availability calendar.',
              },
              {
                emoji: '🔒',
                title: 'Secure & Compliant',
                desc: 'HTTPS everywhere, encrypted data, GDPR-aware. Built for hosts who take security and compliance seriously.',
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-200 p-5">
                <div className="text-2xl mb-3">{emoji}</div>
                <p className="font-semibold text-gray-900 mb-2">{title}</p>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's in the platform */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Everything Included</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Direct booking website (no-code builder)',
                'Real-time availability calendar',
                'Stripe Connect payment integration',
                'PayPal payment integration',
                'Custom domain connection',
                'SSL certificate',
                'Booking confirmations (automated email)',
                'Guest checkout with booking form',
                'Reservation management dashboard',
                'Guest messaging and inbox',
                'Property management (multi-property)',
                'Promo codes and discounts',
                'Seasonal pricing rules',
                'House rules and check-in instructions',
                'Photo gallery management',
                'Analytics and reporting',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who Propvian Is For</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Individual vacation rental hosts',
                desc: 'You own one or a few properties and want to capture direct bookings alongside your Airbnb/VRBO presence.',
              },
              {
                title: 'Hosts building a direct booking brand',
                desc: 'You\'re ready to invest in a long-term direct booking strategy — your own domain, your own website, your own guest list.',
              },
              {
                title: 'Hosts tired of OTA fees',
                desc: 'You understand that even a small shift from OTA to direct bookings compounds into significant savings each year.',
              },
              {
                title: 'Short-term rental operators',
                desc: 'You operate multiple properties and need a centralized platform for managing bookings across your portfolio.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Start Your Direct Booking Operation</h2>
            <p className="text-primary-100 mb-8">Free trial — no credit card required. Your booking website is live in minutes.</p>
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
              { to: '/booking-engine', label: 'Booking Engine' },
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
