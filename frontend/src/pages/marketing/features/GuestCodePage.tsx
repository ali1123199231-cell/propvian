import { Link } from 'react-router-dom'
import { Zap, Clock, Shield, Bell, RefreshCw, FileText, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'

const faqs = [
  {
    question: 'How are guest door codes generated?',
    answer:
      'When a new reservation is detected in your Airbnb or Booking.com calendar, Propvian calls the TTLock API to create a new access code. The code is set to be valid from your check-in time to your check-out time. The entire process happens automatically in the background.',
  },
  {
    question: 'Is each guest code unique?',
    answer:
      "Yes. Every reservation gets a distinct code that is different from every other code at that property. This means past guests cannot reuse old codes, and there's a clear audit trail linking each code to a specific reservation.",
  },
  {
    question: 'What if I need to change the check-in time after a code is generated?',
    answer:
      "You can update the check-in or check-out time for any reservation in the Propvian dashboard. When you save the change, the associated door code is automatically updated to match the new validity window.",
  },
  {
    question: 'Can codes be shared with co-hosts?',
    answer:
      "Yes. The code is visible in your Propvian dashboard for any reservation. You can share it with your co-host so they can verify access if needed. You can also add team members to your Propvian account.",
  },
  {
    question: 'What happens to the code after checkout?',
    answer:
      "Time-limited TTLock codes expire at the set checkout time automatically — the lock enforces this independently. Propvian also sends a revocation command at checkout as a backup. After revocation, the code no longer works regardless of what the guest does.",
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Automatic Guest Code Generation | Propvian',
  description:
    'Automatically generate time-limited TTLock door codes for every Airbnb and Booking.com reservation. Codes are revoked automatically at checkout.',
  url: 'https://propvian.com/features/guest-code-automation',
}

export function GuestCodePage() {
  return (
    <>
      <SEOHead
        title="Automatic Guest Door Code Generation — Smart Lock Automation"
        description="Generate time-limited TTLock door codes automatically for every Airbnb and Booking.com reservation. Codes are created on booking and revoked at checkout. Free trial."
        canonical="/features/guest-code-automation"
        schema={[schema, faqSchema(faqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-emerald-50 via-white to-primary-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Zap size={12} /> Guest Code Automation
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Automatic door code generation for every reservation
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Stop generating door codes manually. Propvian creates a unique, time-limited code for every confirmed reservation — and revokes it automatically at checkout.
              </p>
              <Link to="/" state={{ tab: 'signup' }}
                className="inline-flex items-center gap-2 btn-primary py-3 px-8 text-sm">
                Start Free Trial <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Lifecycle */}
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">The complete code lifecycle</h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">From reservation confirmation to checkout — every step is automated.</p>
            <div className="relative">
              <div className="hidden sm:block absolute left-8 top-10 bottom-10 w-0.5 bg-primary-100" />
              <div className="space-y-6">
                {[
                  { icon: <RefreshCw size={18} />, title: 'Reservation detected', desc: 'Propvian syncs your Airbnb or Booking.com calendar and detects the new confirmed reservation.' },
                  { icon: <Zap size={18} />, title: 'Code generated instantly', desc: 'A unique time-limited code is created in TTLock, valid from your configured check-in time to checkout time.' },
                  { icon: <Bell size={18} />, title: 'You receive a notification', desc: 'Before the guest arrives, you get an alert with their name, arrival time, and the generated code.' },
                  { icon: <FileText size={18} />, title: 'Code logged in dashboard', desc: 'The code, reservation details, and validity window are recorded in your access log for audit purposes.' },
                  { icon: <Shield size={18} />, title: 'Code revoked at checkout', desc: 'At checkout time, the code expires automatically. Propvian sends a revocation command as a backup.' },
                ].map(({ icon, title, desc }, i) => (
                  <div key={title} className="flex items-start gap-5">
                    <div className="relative z-10 w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      {icon}
                    </div>
                    <div className="pt-3">
                      <p className="text-xs font-bold text-primary-400 mb-0.5">STEP {i + 1}</p>
                      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-14 bg-gray-50 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why automated code management matters</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <Clock size={18} />, title: 'Save hours per week', desc: 'No more manual code creation, tracking, or revocation across dozens of reservations.' },
                { icon: <Shield size={18} />, title: 'Eliminate security gaps', desc: "Codes are always revoked on time — no ex-guests with lingering access, ever." },
                { icon: <Zap size={18} />, title: 'Works 24/7', desc: "A last-minute midnight booking gets its code generated automatically. No intervention needed." },
                { icon: <RefreshCw size={18} />, title: 'Handles cancellations', desc: "When a booking is cancelled, the code is revoked immediately — not when you notice." },
                { icon: <Bell size={18} />, title: 'You stay in control', desc: "Codes are always available in your dashboard. You decide when and how to share them." },
                { icon: <FileText size={18} />, title: 'Full audit trail', desc: "Every code created, used, and revoked is logged with timestamps and reservation details." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4">{icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Everything included in code automation</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-left">
              {[
                'Unique code per reservation',
                'Time-limited validity (check-in to checkout)',
                'Automatic revocation at checkout',
                'Cancellation handling',
                'Code override capability',
                'Multi-lock support per property',
                'Host notification before each arrival',
                'Full access code history',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 p-3.5 border border-gray-100 rounded-xl">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} title="Guest Code Automation FAQ" />
        <CTASection title="Automate your guest door codes" subtitle="Connect your lock and calendar. Codes are generated automatically for every reservation from day one." />
        <MarketingFooter />
      </div>
    </>
  )
}
