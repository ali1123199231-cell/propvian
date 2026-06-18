import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2 } from 'lucide-react'

const features = [
  'Launch a professional booking website in minutes — no coding required',
  'Accept direct bookings and payments via Stripe and PayPal',
  'Connect your own custom domain (e.g. stayatmyplace.com)',
  'Manage availability, pricing, and house rules in one dashboard',
  'Keep 100% of your booking revenue — no OTA commission',
  'Automated guest communication and booking confirmations',
  'Real-time availability calendar with hold and buffer logic',
  'Fully mobile-responsive website with SEO-optimized templates',
]

const faqs = [
  {
    q: 'Do I need technical skills to build a direct booking website?',
    a: 'No. Propvian\'s no-code website builder lets you launch a complete, professional booking website in minutes. Choose a template, add your property details and photos, and your site is live.',
  },
  {
    q: 'Does Propvian take a percentage of my bookings?',
    a: 'No. Propvian is a flat-rate SaaS subscription. Payments go directly from guests to you via Stripe or PayPal — Propvian never touches your booking revenue.',
  },
  {
    q: 'Can I connect my own domain name?',
    a: 'Yes. You can connect any custom domain to your Propvian-powered website. We support full DNS integration and provide step-by-step instructions.',
  },
  {
    q: 'Can I accept payments from guests directly?',
    a: 'Yes. Propvian integrates with Stripe and PayPal so guests can pay securely at checkout. Funds go directly to your connected account.',
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian Direct Booking Website Builder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Build a direct booking website for your vacation rental. Accept payments, manage availability, and connect your own domain — no coding required.',
  offers: {
    '@type': 'Offer',
    description: 'Monthly SaaS subscription',
  },
  url: 'https://propvian.com/direct-booking-website',
}

export function DirectBookingWebsitePage() {
  return (
    <>
      <SEOHead
        title="Direct Booking Website for Vacation Rentals"
        description="Build a professional direct booking website for your vacation rental property. Accept payments, manage availability, and keep 100% of your revenue. No OTA commissions. Free trial."
        canonical="/direct-booking-website"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Direct Booking Website</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Your Own Direct Booking Website — Built in Minutes
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Stop paying Airbnb and Booking.com commissions. Propvian gives vacation rental hosts a professional, commission-free direct booking website with integrated payments, availability management, and guest communication.
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

        {/* Features */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Everything You Need for Direct Bookings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{f}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">How It Works</h2>
            <div className="space-y-8">
              {[
                { step: '1', title: 'Create your account', desc: 'Sign up for a free trial. No credit card required. Your account is ready in seconds.' },
                { step: '2', title: 'Build your booking website', desc: 'Choose from professionally designed templates. Add your property details, photos, pricing, and availability. Your website is live on a Propvian subdomain immediately.' },
                { step: '3', title: 'Connect your payment account', desc: 'Link your Stripe or PayPal account so guests can pay you directly. Propvian never holds your funds.' },
                { step: '4', title: 'Connect your custom domain', desc: 'Point your own domain (e.g. mybeachhouse.com) to your Propvian site and brand your booking experience completely.' },
                { step: '5', title: 'Start accepting bookings', desc: 'Share your direct booking link and start receiving commission-free reservations. Guests book, pay, and receive confirmation — automatically.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-5">
                  <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">{step}</div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-6">
                <p className="font-semibold text-gray-900 mb-2">{q}</p>
                <p className="text-sm text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Accept Direct Bookings?</h2>
            <p className="text-primary-100 mb-8">Join vacation rental hosts who use Propvian to build their own booking website and keep 100% of their revenue.</p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
              Start Your Free Trial
            </Link>
          </div>
        </section>

        {/* Internal linking */}
        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <p className="text-sm font-semibold text-gray-900 mb-4">Explore Propvian</p>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/vacation-rental-website-builder', label: 'Website Builder' },
              { to: '/airbnb-alternative', label: 'Airbnb Alternative' },
              { to: '/direct-booking-software', label: 'Direct Booking Software' },
              { to: '/booking-engine', label: 'Booking Engine' },
              { to: '/blog/how-to-increase-direct-bookings', label: 'How to Increase Direct Bookings' },
              { to: '/blog/direct-booking-vs-ota', label: 'Direct Booking vs OTA' },
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
