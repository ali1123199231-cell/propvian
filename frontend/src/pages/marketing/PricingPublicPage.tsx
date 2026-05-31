import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Zap, Building2 } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { SEOHead } from '@/components/seo/SEOHead'
import { systemConfigApi } from '@/api/systemConfig'
import type { BusinessModel } from '@/types'

// ── Direct Booking pricing content ────────────────────────────────────────────

const directFaqs = [
  {
    question: 'How does the $10 per property / month pricing work?',
    answer:
      'You pay a flat $10/month for each active property in your account. Add a property, it bills $10/month. Remove it, billing stops. Simple.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes — you get 14 days free to set up your property, connect your domain, and test the booking flow. No credit card required to start.',
  },
  {
    question: 'Can I cancel at any time?',
    answer:
      'Absolutely. No annual contracts, no cancellation fees. Cancel from your billing settings and you retain access until the end of your current billing period.',
  },
  {
    question: 'Does Propvian take a commission on bookings?',
    answer:
      'No. Propvian charges a flat platform fee. Guest payments go directly to your Stripe or PayPal account — Propvian never touches guest funds or takes a percentage.',
  },
  {
    question: 'What payment methods can my guests use?',
    answer:
      'Your guests can pay via credit/debit card through your Stripe account, or via PayPal. You control which options are enabled on your booking page.',
  },
  {
    question: 'What happens if I add more properties?',
    answer:
      'Billing is calculated per active property. Each new property you activate adds $10/month to your bill, prorated for the current billing period.',
  },
]

const directSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Propvian',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Direct booking software for short-term rental hosts. Launch your own branded booking website and accept payments directly — no OTA commissions.',
  offers: {
    '@type': 'Offer',
    price: '10.00',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '10.00',
      priceCurrency: 'USD',
      unitText: 'per property per month',
    },
  },
  url: 'https://propvian.com',
  featureList: [
    'Branded direct booking website',
    'Custom domain support with SSL',
    'Stripe & PayPal guest payments (direct to host)',
    'Availability calendar & booking management',
    'Automated guest emails',
    'Guest review management',
    'iCal sync with Airbnb & Booking.com',
    'OTA listing verification',
    'Analytics dashboard',
  ],
}

function DirectPricingPage() {
  const navigate = useNavigate()
  return (
    <>
      <SEOHead
        title="Pricing — $10 per Property / Month | Propvian"
        description="Simple, transparent pricing for direct booking software. $10 per property per month — flat fee, no OTA commissions. Launch your branded booking website today."
        canonical="/pricing"
        schema={[directSchema, faqSchema(directFaqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary-950 to-primary-900 text-center px-4">
          <p className="text-sm font-semibold text-primary-300 uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
            One flat fee.<br className="hidden sm:block" /> Zero commissions.
          </h1>
          <p className="text-lg text-primary-200 max-w-xl mx-auto">
            $10 per property per month. No booking fees. No OTA cuts. Every dollar your guest pays goes to you.
          </p>
        </section>

        {/* Pricing card */}
        <section className="py-14 px-4">
          <div className="max-w-lg mx-auto">
            <div className="border-2 border-primary-500 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-primary-600 px-8 py-6 text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
                  <Zap size={14} className="text-primary-200" />
                  <span className="text-sm font-semibold text-white">14-day free trial — no credit card</span>
                </div>
                <div className="text-white">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-extrabold">$10</span>
                    <div className="pb-1.5 text-left">
                      <div className="text-primary-200 text-sm font-medium">per property</div>
                      <div className="text-primary-200 text-sm font-medium">per month</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-8 py-8">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Everything included</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Branded booking website with custom domain',
                    'SSL certificate — auto-provisioned',
                    'Stripe & PayPal payments (direct to you)',
                    'Availability calendar & booking management',
                    'Automated guest confirmation emails',
                    'iCal sync with Airbnb & Booking.com',
                    'Guest review management',
                    'Analytics & revenue dashboard',
                    'Identity & property verification',
                    'Email support',
                  ].map(feature => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                      <Check size={15} className="text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/')}
                  className="btn-primary w-full justify-center py-3 text-base">
                  Start free trial <ArrowRight size={16} />
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">No credit card required · Cancel anytime</p>
              </div>
            </div>

            {/* Example calculation */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Building2 size={14} className="text-primary-500" /> Example cost calculation
              </p>
              <div className="space-y-2 text-sm">
                {[
                  ['1 property',  '$10/month'],
                  ['3 properties','$30/month'],
                  ['5 properties','$50/month'],
                  ['10 properties','$100/month'],
                ].map(([label, cost]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{cost}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Compare: OTA platforms charge 3–15% per booking. On a $1,500/month property, that's $45–225/month in fees vs. $10 with Propvian.
              </p>
            </div>
          </div>
        </section>

        <FAQSection items={directFaqs} title="Pricing FAQ" />
        <MarketingFooter />
      </div>
    </>
  )
}

// ── TTLock pricing content ────────────────────────────────────────────────────

const ttlockFaqs = [
  {
    question: 'How does the $2 per lock / month pricing work?',
    answer: 'You pay for each smart lock connected to Propvian. If you have one property with one lock, it\'s $2/month.',
  },
  {
    question: 'What\'s included in the free trial?',
    answer: 'Full access to all Propvian features for 30 days — unlimited properties, automatic code generation, Airbnb and Booking.com integration, host notifications, and the full dashboard. No credit card required.',
  },
  {
    question: 'Can I cancel at any time?',
    answer: 'Yes. No annual contracts. Cancel from billing settings any time. You retain access until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'All major credit and debit cards through Stripe, and PayPal.',
  },
]

function TTLockPricingPage() {
  const navigate = useNavigate()
  return (
    <>
      <SEOHead
        title="Pricing — $2 per Lock / Month | Propvian"
        description="Simple pricing for smart lock automation. $2 per lock per month. Free 30-day trial. Works with Airbnb and Booking.com."
        canonical="/pricing"
        schema={[faqSchema(ttlockFaqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary-950 to-primary-900 text-center px-4">
          <p className="text-sm font-semibold text-primary-300 uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
            Simple pricing.<br className="hidden sm:block" /> No surprises.
          </h1>
          <p className="text-lg text-primary-200 max-w-xl mx-auto">
            Pay per lock. No seat fees, no platform charges.
          </p>
        </section>
        <section className="py-14 px-4">
          <div className="max-w-lg mx-auto">
            <div className="border-2 border-primary-500 rounded-2xl overflow-hidden shadow-xl">
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
              <div className="bg-white px-8 py-8">
                <ul className="space-y-3 mb-8">
                  {['Unlimited properties','Automatic TTLock code generation','Airbnb calendar sync','Booking.com calendar sync','Automatic code revocation','Host arrival notifications','Cleaning task management','Full reservation dashboard','Email support'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <Check size={15} className="text-emerald-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/')} className="btn-primary w-full justify-center py-3 text-base">
                  Start Free Trial <ArrowRight size={16} />
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">No credit card required · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>
        <FAQSection items={ttlockFaqs} title="Pricing FAQ" />
        <MarketingFooter />
      </div>
    </>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────

export function PricingPublicPage() {
  const [model, setModel] = useState<BusinessModel>('ttlock')
  useEffect(() => {
    systemConfigApi.getBusinessModel().then(m => setModel(m as BusinessModel)).catch(() => {})
  }, [])
  return model === 'direct_booking' ? <DirectPricingPage /> : <TTLockPricingPage />
}
