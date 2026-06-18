import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2 } from 'lucide-react'

const faqs = [
  {
    q: 'What makes a website builder "best" for vacation rentals specifically?',
    a: 'A generic website builder like Squarespace or Wix gives you pages — it doesn\'t give you a calendar that actually knows which dates are booked, a checkout that takes a deposit or full payment, or a way to stop a guest from booking a date someone else already holds. For a vacation rental or short-term rental, the booking engine and the website have to be the same system, not a website with a booking widget bolted on.',
  },
  {
    q: 'Is Propvian a full property management system (PMS)?',
    a: 'No, and we\'d rather tell you that upfront than have you find out after signing up. Propvian builds your booking website, handles real-time availability, and processes payments through Stripe or PayPal — but it doesn\'t push rates across multiple OTAs the way a full PMS or channel manager does. It pulls your existing Airbnb and Booking.com calendars in via iCal sync so a direct booking can\'t double-book an already-reserved date. If you\'re managing 20+ units across several channels and need two-way rate sync, a PMS like Cloudbeds or Hostaway is the better fit. If you\'re running a handful of properties and want a direct booking website without paying another commission, Propvian is built for exactly that.',
  },
  {
    q: 'Can I use this if I already list on Airbnb and Vrbo?',
    a: 'Yes — most hosts using Propvian keep their OTA listings active for new-guest discovery and use their Propvian website for repeat guests, referrals, and direct search traffic. The two channels work alongside each other; your direct booking website isn\'t meant to replace Airbnb, just to stop you paying its commission on every guest who already knows you.',
  },
]

const templates = [
  { name: 'Beachfront', desc: 'Light and airy design for coastal properties' },
  { name: 'Mountain Retreat', desc: 'Warm tones for cabins and mountain homes' },
  { name: 'City Apartment', desc: 'Clean, modern layout for urban rentals' },
  { name: 'Villa & Estate', desc: 'Luxury presentation for high-end properties' },
  { name: 'Countryside Cottage', desc: 'Rustic feel for rural retreats' },
  { name: 'Minimalist', desc: 'Pure white canvas that puts your photos first' },
]

const builderFeatures = [
  { title: 'Drag-and-drop sections', desc: 'Build your site from pre-designed blocks: hero, gallery, amenities, location, house rules, reviews, and more.' },
  { title: '16+ section types', desc: 'Every section type you need to convert visitors — photo carousels, feature lists, FAQs, maps, and booking widgets.' },
  { title: 'No code required', desc: 'Point-and-click editing. No HTML, CSS, or developer needed.' },
  { title: 'Custom domain support', desc: 'Connect any domain name (e.g. mystayinparis.com) with step-by-step DNS instructions.' },
  { title: 'Mobile-responsive by default', desc: 'Every template and section is optimized for mobile. Guests book from phones — your site is ready.' },
  { title: 'Integrated booking widget', desc: 'The booking calendar and checkout are built into your site. Guests can book and pay without leaving your page.' },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian Vacation Rental Website Builder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'No-code vacation rental website builder for short-term rental hosts. Professional templates, integrated booking, custom domains.',
  url: 'https://propvian.com/vacation-rental-website-builder',
}

export function VacationRentalBuilderPage() {
  return (
    <>
      <SEOHead
        title="Best Website Builder for Vacation Rentals & Short-Term Rentals"
        description="Looking for the best website builder for vacation rentals or short-term rentals? Propvian combines a no-code site builder with a real booking calendar and direct payments. Free trial."
        canonical="/vacation-rental-website-builder"
        noIndex={false}
        schema={schema}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white pt-16 pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-3">Vacation Rental Website Builder</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              The Best Website Builder for Vacation Rentals and Short-Term Rentals
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Most "best website builder" lists are written for restaurants and portfolios — not for hosts who need a real booking calendar. Propvian is a no-code website builder built specifically for vacation rental and short-term rental properties, with a booking engine and payment processing built in, not bolted on.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Start Building — Free
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                See Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Professional Templates for Every Property Type</h2>
            <p className="text-sm text-gray-600 text-center mb-10">Start with a template and customize every section to match your brand.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {templates.map(({ name, desc }) => (
                <div key={name} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="w-full h-24 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 mb-3 flex items-center justify-center">
                    <span className="text-2xl">🏡</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{name}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Builder features */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">A Website Builder Made for Short-Term Rentals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {builderFeatures.map(({ title, desc }) => (
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

        {/* What's included */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What's Included</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Real-time availability calendar',
                'Instant booking or inquiry-first checkout',
                'Stripe and PayPal payment integration',
                'Promo code and discount support',
                'Guest checkout with booking confirmation',
                'Host dashboard and reservation management',
                'Custom domain connection',
                'SSL certificate (HTTPS)',
                'Mobile-optimized design',
                'SEO-friendly page structure',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
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
            <h2 className="text-2xl font-bold text-white mb-4">Launch Your Vacation Rental Website Today</h2>
            <p className="text-primary-100 mb-8">Start your free trial and have a professional booking website live in under 30 minutes.</p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </section>

        {/* Internal linking */}
        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <p className="text-sm font-semibold text-gray-900 mb-4">Related</p>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/direct-booking-website', label: 'Direct Booking Website' },
              { to: '/airbnb-alternative', label: 'Airbnb Alternative' },
              { to: '/booking-engine', label: 'Booking Engine' },
              { to: '/direct-booking-software', label: 'Direct Booking Software' },
              { to: '/blog/best-direct-booking-software-independent-hotels', label: 'PMS vs Direct Booking Software' },
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
