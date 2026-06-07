import { Link } from 'react-router-dom'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { CheckCircle2 } from 'lucide-react'

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
        title="Vacation Rental Website Builder"
        description="Build a vacation rental website in minutes with Propvian's no-code website builder. Professional templates, integrated booking calendar, payments, and custom domains. Free trial."
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
              Build Your Vacation Rental Website in Minutes
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              No code, no designer, no agency. Propvian's no-code website builder gives vacation rental hosts everything they need to launch a professional booking website with a real booking engine and integrated payments.
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
