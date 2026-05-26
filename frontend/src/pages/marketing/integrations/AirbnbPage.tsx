import { Link } from 'react-router-dom'
import { Calendar, Clock, Bell, Shield, Zap, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'

const faqs = [
  {
    question: 'Does Propvian integrate directly with Airbnb?',
    answer:
      'Propvian syncs with Airbnb via the standard iCal calendar export, which is the recommended and officially supported method for third-party integrations. You copy your Airbnb calendar link from your hosting settings and paste it into Propvian — no Airbnb API keys required.',
  },
  {
    question: 'How often does Propvian sync with Airbnb?',
    answer:
      'Propvian syncs your Airbnb calendar every 15 minutes. New reservations are detected quickly, and cancellations are processed within the same window. For most hosts, this sync frequency is more than sufficient.',
  },
  {
    question: 'Will Airbnb guests receive the door code directly from Propvian?',
    answer:
      'No. Propvian generates the code and notifies you — the host — before each arrival. You then share the code with your guest through your preferred channel (Airbnb message, SMS, email). This keeps you in control of guest communication.',
  },
  {
    question: 'What happens when an Airbnb reservation is cancelled?',
    answer:
      'When a cancellation is detected in the next sync cycle, Propvian automatically revokes the associated door code. The guest will no longer be able to access the property after cancellation.',
  },
  {
    question: 'Can I use Propvian if I have multiple Airbnb listings?',
    answer:
      'Yes. Each Airbnb listing has its own iCal export URL. You create a separate property in Propvian for each listing, connect the corresponding iCal URL, and assign the appropriate lock. All properties are managed from the same dashboard.',
  },
  {
    question: 'Does Propvian work alongside Airbnb\'s native access features?',
    answer:
      "Yes. Propvian works independently of whatever Airbnb offers natively. If you're using TTLock hardware, Propvian gives you full automation that Airbnb's native tools don't support.",
  },
]

const integrationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Airbnb Smart Lock Integration | Propvian',
  description:
    'Automatically generate and revoke TTLock door codes from your Airbnb reservations. Sync your Airbnb calendar and automate guest access in minutes.',
  url: 'https://propvian.com/integrations/airbnb',
}

export function AirbnbPage() {
  return (
    <>
      <SEOHead
        title="Airbnb Smart Lock Integration — Automated Guest Access"
        description="Automatically generate and revoke TTLock door codes from your Airbnb reservations. Connect your Airbnb calendar and automate self check-in in minutes. Free 30-day trial."
        canonical="/integrations/airbnb"
        schema={[integrationSchema, faqSchema(faqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-rose-50 via-white to-primary-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Airbnb Integration
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Automate Airbnb guest access with TTLock
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Connect your Airbnb calendar to Propvian and every confirmed reservation automatically triggers a time-limited door code. No more manual code management.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/" state={{ tab: 'signup' }}
                  className="inline-flex items-center justify-center gap-2 btn-primary py-3 px-8 text-sm">
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <Link to="/blog/airbnb-smart-lock-automation"
                  className="inline-flex items-center justify-center gap-2 btn-secondary py-3 px-8 text-sm">
                  Read the setup guide
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20 bg-white px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">How the Airbnb integration works</h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Propvian connects to Airbnb via iCal sync — the same method used by all major property management systems.</p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: <Calendar size={20} />, step: '01', title: 'Sync your Airbnb calendar', desc: 'Paste your Airbnb iCal export URL into Propvian. The calendar syncs every 15 minutes.' },
                { icon: <Zap size={20} />, step: '02', title: 'Code generated automatically', desc: 'When a new reservation is detected, a time-limited door code is created in TTLock instantly.' },
                { icon: <Bell size={20} />, step: '03', title: 'You get notified', desc: 'Before each arrival, you receive a notification with the guest name and door code — ready to forward.' },
                { icon: <Shield size={20} />, step: '04', title: 'Code revoked at checkout', desc: 'At checkout, the code expires automatically. No manual cleanup required.' },
              ].map(({ icon, step, title, desc }) => (
                <div key={step} className="relative">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4">{icon}</div>
                  <p className="text-xs font-bold text-primary-400 mb-1">{step}</p>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-gray-50 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">What's included with the Airbnb integration</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                'Automatic code generation per reservation',
                'Time-limited codes matching check-in/out times',
                'Automatic revocation on checkout',
                'Cancellation detection and code removal',
                'Host notification before each arrival',
                'Multi-listing support from one account',
                'Audit log for all generated codes',
                'Manual code override when needed',
                'Back-to-back reservation handling',
              ].map((f) => (
                <div key={f} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                  <Check size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
            <div className="space-y-3">
              {[
                { req: 'An active Airbnb host account', note: 'Any hosting plan' },
                { req: 'A TTLock-compatible smart lock', note: 'Any lock running the TTLock firmware' },
                { req: 'A Propvian account', note: 'Free 30-day trial, no card required' },
              ].map(({ req, note }) => (
                <div key={req} className="flex items-center gap-4 border border-gray-200 rounded-xl p-4 bg-white">
                  <Check size={16} className="text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{req}</p>
                    <p className="text-xs text-gray-400">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} title="Airbnb Integration FAQ" />
        <CTASection title="Start automating your Airbnb guest access" subtitle="Connect your Airbnb calendar and your first TTLock lock. Setup takes about 5 minutes." />
        <MarketingFooter />
      </div>
    </>
  )
}
