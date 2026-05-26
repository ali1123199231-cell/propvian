import { Link } from 'react-router-dom'
import { Lock, Shield, Wifi, Clock, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'

const faqs = [
  {
    question: 'What is TTLock?',
    answer:
      "TTLock is a firmware platform and cloud API used by a wide range of smart lock manufacturers. If your lock connects to the TTLock app, it's running TTLock firmware and is compatible with Propvian.",
  },
  {
    question: 'How does Propvian connect to my TTLock lock?',
    answer:
      "Propvian uses the official TTLock OAuth authorization flow. You log in to your TTLock account through a secure pop-up, and Propvian receives a token that grants it permission to manage codes on your locks. Your TTLock password is never shared with Propvian.",
  },
  {
    question: 'Do I need a TTLock gateway?',
    answer:
      "For remote code management (which is required for automation), you need either a Wi-Fi enabled TTLock lock or a TTLock gateway device at your property. The gateway connects via Bluetooth to the lock and via Wi-Fi to the internet, enabling cloud control.",
  },
  {
    question: 'Does Propvian support multiple TTLock locks per property?',
    answer:
      "Yes. You can assign multiple locks to a single property. When a reservation is processed, codes are generated for all locks at that property. This is useful for properties with multiple entry points (main door, gate, parking).",
  },
  {
    question: 'Can I still use the TTLock app alongside Propvian?',
    answer:
      "Yes. Propvian and the TTLock app work independently. You can continue using the TTLock app for manual code creation, firmware updates, and lock settings. Propvian manages only the codes it creates — it doesn't affect codes you create manually.",
  },
  {
    question: 'What happens if the TTLock API is unavailable?',
    answer:
      "If the TTLock API is temporarily unavailable, Propvian queues the code creation attempt and retries automatically. If the issue persists, you'll receive an alert so you can handle the access manually. Existing codes already programmed on the lock continue to work regardless of API availability.",
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'TTLock Integration | Propvian — Smart Lock Automation',
  description:
    'Connect your TTLock smart lock to Propvian and automate guest code generation for Airbnb and Booking.com reservations.',
  url: 'https://propvian.com/integrations/ttlock',
}

export function TTLockPage() {
  return (
    <>
      <SEOHead
        title="TTLock Integration — Connect Your Smart Lock to Airbnb & Booking.com"
        description="Connect your TTLock smart lock to Propvian and automatically generate guest door codes for every Airbnb and Booking.com reservation. Free 30-day trial."
        canonical="/integrations/ttlock"
        schema={[schema, faqSchema(faqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-primary-50 via-white to-indigo-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Lock size={12} /> TTLock Integration
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                TTLock automation for Airbnb and Booking.com hosts
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Propvian uses the TTLock cloud API to automatically create and revoke time-limited door codes for every guest reservation — no manual code management needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/" state={{ tab: 'signup' }}
                  className="inline-flex items-center justify-center gap-2 btn-primary py-3 px-8 text-sm">
                  Connect Your Lock <ArrowRight size={15} />
                </Link>
                <Link to="/blog/ttlock-setup-guide"
                  className="inline-flex items-center justify-center gap-2 btn-secondary py-3 px-8 text-sm">
                  TTLock setup guide
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is TTLock */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5">
                  What is TTLock — and why it's ideal for rental automation
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  TTLock is a firmware platform and cloud API used by dozens of smart lock manufacturers worldwide. Any lock running TTLock firmware can be controlled programmatically through the TTLock API.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  This matters for automation: rather than manually creating codes in an app, Propvian calls the TTLock API when a reservation is confirmed — creating a time-limited code that's valid only during the guest's stay. No apps, no reminders, no manual steps.
                </p>
                <Link to="/blog/ttlock-setup-guide" className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2">
                  Read the complete TTLock setup guide →
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Wifi size={18} />, title: 'Cloud API access', desc: 'Propvian uses the official TTLock API to create and revoke codes remotely — no phone at the property needed.' },
                  { icon: <Clock size={18} />, title: 'Time-limited codes', desc: 'Codes are valid only during the reservation window. They expire automatically at checkout.' },
                  { icon: <Shield size={18} />, title: 'Secure OAuth connection', desc: 'Your TTLock account is connected via OAuth. Propvian never sees your password.' },
                  { icon: <Lock size={18} />, title: 'Works with any TTLock lock', desc: 'Any lock that uses the TTLock app is supported — hundreds of models from dozens of manufacturers.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                    <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">{icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 bg-gray-50 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What Propvian does with your TTLock</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Creates time-limited codes per reservation',
                'Revokes codes automatically after checkout',
                'Handles cancellations immediately',
                'Supports multiple locks per property',
                'Syncs battery level and lock status',
                'Sends host notifications with each code',
                'Maintains a full access code audit log',
                'Handles back-to-back reservations cleanly',
                'Retry on API failures with alerts',
              ].map((cap) => (
                <div key={cap} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                  <Check size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} title="TTLock Integration FAQ" />
        <CTASection title="Connect your TTLock and automate guest access" subtitle="Works with any lock running the TTLock firmware. Setup takes about 5 minutes." />
        <MarketingFooter />
      </div>
    </>
  )
}
