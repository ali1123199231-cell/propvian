import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Zap } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { SEOHead } from '@/components/seo/SEOHead'

const pricingFaqs = [
  {
    question: 'How does the $2 per lock / month pricing work?',
    answer:
      'You pay for each smart lock connected to Propvian. If you have one property with one lock, it\'s $2/month. If you have three properties with two locks each, that\'s $12/month. Most hosts have one or two locks per property.',
  },
  {
    question: 'What\'s included in the free trial?',
    answer:
      'The free trial gives you full access to all Propvian features for 30 days — unlimited properties, automatic code generation, Airbnb and Booking.com integration, host notifications, and the full dashboard. No credit card is required to start.',
  },
  {
    question: 'Can I cancel at any time?',
    answer:
      'Yes. There are no annual contracts. You can cancel your subscription at any time from the billing settings. You\'ll retain access until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Propvian accepts all major credit and debit cards through Stripe, and PayPal. Payment is processed securely — your card details never touch our servers directly.',
  },
  {
    question: 'Is there a discount for multiple locks?',
    answer:
      'The pricing is flat at $2 per lock per month regardless of quantity. As your portfolio grows, you benefit from the same simple, predictable pricing.',
  },
  {
    question: 'What happens after my trial ends?',
    answer:
      'After 30 days, you\'ll be prompted to add a payment method to continue. If you don\'t subscribe, your account remains accessible but automation pauses. Your data is preserved.',
  },
]

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Smart lock automation software for short-term rental hosts. Automatically generates and revokes TTLock door codes from Airbnb and Booking.com reservations.',
  offers: {
    '@type': 'Offer',
    price: '2.00',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '2.00',
      priceCurrency: 'USD',
      unitText: 'per lock per month',
    },
  },
  url: 'https://propvian.com',
  featureList: [
    'Automatic TTLock guest code generation',
    'Airbnb calendar integration',
    'Booking.com calendar integration',
    'Automatic code revocation after checkout',
    'Host notifications before each arrival',
    'Multi-property management',
    'Full access code audit log',
  ],
}

export function PricingPublicPage() {
  const navigate = useNavigate()
  return (
    <>
      <SEOHead
        title="Pricing — $2 per Lock / Month | Propvian"
        description="Simple, transparent pricing for smart lock automation. $2 per lock per month. Free 30-day trial, no credit card required. Works with Airbnb and Booking.com."
        canonical="/pricing"
        schema={[productSchema, faqSchema(pricingFaqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary-950 to-primary-900 text-center px-4">
          <p className="text-sm font-semibold text-primary-300 uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
            Simple pricing.<br className="hidden sm:block" /> No surprises.
          </h1>
          <p className="text-lg text-primary-200 max-w-xl mx-auto">
            Pay for what you actually use. One flat rate per lock — no seat fees, no platform charges.
          </p>
        </section>

        {/* Pricing card */}
        <section className="py-14 px-4">
          <div className="max-w-lg mx-auto">
            <div className="border-2 border-primary-500 rounded-2xl overflow-hidden shadow-xl">
              {/* Header */}
              <div className="bg-primary-600 px-8 py-6 text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
                  <Zap size={14} className="text-primary-200" />
                  <span className="text-sm font-semibold text-white">30-day free trial included</span>
                </div>
                <div className="text-white">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-extrabold">$2</span>
                    <div className="pb-1.5 text-left">
                      <div className="text-primary-200 text-sm font-medium">per lock</div>
                      <div className="text-primary-200 text-sm font-medium">per month</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white px-8 py-8">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Everything included</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited properties',
                    'Automatic TTLock code generation',
                    'Airbnb calendar sync',
                    'Booking.com calendar sync',
                    'Automatic code revocation',
                    'Host arrival notifications',
                    'Cleaning task management',
                    'Full reservation dashboard',
                    'Access code audit log',
                    'Email support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                      <Check size={15} className="text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/', { state: { tab: 'signup' } })}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  Start Free Trial <ArrowRight size={16} />
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">No credit card required · Cancel anytime</p>
              </div>
            </div>

            {/* Example calculation */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4">Example cost calculation</p>
              <div className="space-y-2 text-sm">
                {[
                  ['1 property, 1 lock', '$2/month'],
                  ['3 properties, 1 lock each', '$6/month'],
                  ['5 properties, 2 locks each', '$20/month'],
                  ['10 properties, 1 lock each', '$20/month'],
                ].map(([label, cost]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FAQSection items={pricingFaqs} title="Pricing FAQ" />

        <MarketingFooter />
      </div>
    </>
  )
}
