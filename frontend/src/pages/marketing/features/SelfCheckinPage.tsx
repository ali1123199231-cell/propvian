import { Link } from 'react-router-dom'
import { Key, Star, Smile, Clock, Shield, Smartphone, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'

const faqs = [
  {
    question: 'Do guests need to download an app for self check-in?',
    answer:
      "No. Guests enter using a numeric PIN code on the lock keypad — no app, no account, no smartphone required. This makes the experience accessible to all guests regardless of technical comfort.",
  },
  {
    question: 'What does the guest receive for self check-in?',
    answer:
      "You send the guest a door code through your preferred channel — Airbnb message, SMS, or email. The code is valid only during their reservation window and doesn't work before check-in or after checkout.",
  },
  {
    question: 'Does Propvian send the code to the guest automatically?',
    answer:
      "No. Propvian generates the code and notifies you. You then share it with the guest. This is intentional — guests trust messages from their host, not from unknown third-party software. Propvian gives you the code ready to paste, so the extra step takes only a few seconds.",
  },
  {
    question: 'What if a guest has trouble with self check-in?',
    answer:
      "You always have the active code in your Propvian dashboard, so you can send it again instantly. For persistent issues, you can create a manual override code or provide a backup entry method. With good clear instructions, check-in issues are rare.",
  },
  {
    question: 'Can self check-in be set up for mid-stay access changes?',
    answer:
      "Yes. If a guest extends their stay, you can update their checkout date in Propvian and the code validity is extended automatically. The same applies to early checkouts — the code can be revoked immediately if needed.",
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Self Check-In Automation for Short-Term Rentals | Propvian',
  description:
    'Automate self check-in for your Airbnb and Booking.com properties using TTLock smart locks. Guests enter with a PIN code — no key handover needed.',
  url: 'https://propvian.com/features/self-checkin',
}

export function SelfCheckinPage() {
  return (
    <>
      <SEOHead
        title="Self Check-In Automation for Airbnb & Vacation Rentals"
        description="Eliminate key handovers with automated self check-in. Propvian generates TTLock PIN codes for every reservation so guests arrive to a seamless, keyless experience. Free trial."
        canonical="/features/self-checkin"
        schema={[schema, faqSchema(faqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-amber-50 via-white to-primary-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Key size={12} /> Self Check-In
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Seamless self check-in for every guest
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Eliminate key handovers and coordinate-your-arrival messages. Guests receive a PIN code for their stay — and the door locks itself behind them.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/" state={{ tab: 'signup' }}
                  className="inline-flex items-center justify-center gap-2 btn-primary py-3 px-8 text-sm">
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <Link to="/blog/self-checkin-improves-guest-experience"
                  className="inline-flex items-center justify-center gap-2 btn-secondary py-3 px-8 text-sm">
                  Why self check-in matters
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What it means for guests */}
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5">What guests actually experience</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  A day before arrival, the guest receives a message from you with a door code and simple instructions. They arrive at any time — early morning, late night, whenever — and walk straight in. No coordination, no waiting.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  The code works only during their reservation. When checkout time arrives, the code stops working. Past guests can never reuse it.
                </p>
                <div className="space-y-3">
                  {[
                    'No app download required',
                    'No key pickup or dropoff',
                    'Flexible arrival — any time',
                    'Privacy on arrival',
                    'Works even with no cell signal',
                  ].map((b) => (
                    <div key={b} className="flex items-center gap-3 text-sm text-gray-700">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" /> {b}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Star size={18} />, title: 'Higher check-in review scores', desc: "Airbnb's check-in category scores higher when guests don't have to coordinate with anyone." },
                  { icon: <Smile size={18} />, title: 'Guests feel welcome', desc: 'A smooth arrival sets the tone for the entire stay. Problems at check-in create friction that colors reviews.' },
                  { icon: <Clock size={18} />, title: 'No schedule pressure', desc: 'Guests don\'t need to arrive in your availability window. You don\'t need to wait at the property.' },
                  { icon: <Smartphone size={18} />, title: 'No technology barrier', desc: 'A keypad PIN is universally accessible — no smartphone, account, or app needed.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">{icon}</div>
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

        {/* Security */}
        <section className="py-14 bg-gray-50 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-5">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">More secure than physical keys</h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
              Physical keys can be copied. Access codes can't. Each guest's code is unique to their reservation and expires automatically. Even if a code is shared or misused, it stops working at checkout. There's no way to duplicate or extend access beyond what was granted.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Unique code per guest',
                'Time-limited by reservation',
                'Auto-expires at checkout',
                'Full access log',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700">
                  <Check size={12} className="text-emerald-500" /> {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} title="Self Check-In FAQ" />
        <CTASection title="Enable self check-in for your properties" subtitle="Set up once, works automatically for every reservation. Free 30-day trial." />
        <MarketingFooter />
      </div>
    </>
  )
}
