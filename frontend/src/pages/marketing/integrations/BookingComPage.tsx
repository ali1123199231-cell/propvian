import { Link } from 'react-router-dom'
import { Calendar, Shield, Bell, RefreshCw, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, faqSchema } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'
import { SEOHead } from '@/components/seo/SEOHead'

const faqs = [
  {
    question: 'How does Propvian connect to Booking.com?',
    answer:
      "Propvian connects to Booking.com via the iCal calendar export available in your Booking.com extranet. You copy the export URL and paste it into Propvian. There's no Booking.com API key or special partner access required.",
  },
  {
    question: 'Where do I find my Booking.com iCal URL?',
    answer:
      "In your Booking.com extranet, go to Rates & Availability, then find the calendar export or iCal sync option. The exact location depends on your property type. Copy the full iCal export URL and add it to Propvian under Integrations.",
  },
  {
    question: 'Does Propvian handle Booking.com cancellations automatically?',
    answer:
      "Yes. When a guest cancels on Booking.com, the reservation is removed from the iCal feed. Propvian detects this on the next sync and revokes the associated door code automatically.",
  },
  {
    question: 'Can I use both Airbnb and Booking.com for the same property?',
    answer:
      "Absolutely. Many hosts list the same property on multiple platforms. Connect each platform's iCal feed to the same Propvian property. Reservations from both Airbnb and Booking.com are treated the same way — each gets a unique door code automatically.",
  },
  {
    question: "What check-in and check-out times does Propvian use for Booking.com?",
    answer:
      "Booking.com's iCal feed includes dates but not specific times. Propvian uses the default check-in and check-out times you configure per property. You can also override these on individual reservations in the dashboard.",
  },
]

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Booking.com Smart Lock Integration | Propvian',
  description:
    'Automatically generate and revoke TTLock door codes from your Booking.com reservations. Sync your Booking.com calendar and automate guest check-in.',
  url: 'https://propvian.com/integrations/booking-com',
}

export function BookingComPage() {
  return (
    <>
      <SEOHead
        title="Booking.com Smart Lock Integration — Automated Guest Access"
        description="Connect your Booking.com properties to TTLock smart locks with Propvian. Automatic code generation and revocation for every reservation. Free 30-day trial."
        canonical="/integrations/booking-com"
        schema={[schema, faqSchema(faqs)]}
      />
      <div className="min-h-screen flex flex-col bg-white">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-primary-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Booking.com Integration
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Smart lock automation for Booking.com properties
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Sync your Booking.com reservations and automatically manage TTLock access codes — from confirmation to checkout, handled for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/" state={{ tab: 'signup' }}
                  className="inline-flex items-center justify-center gap-2 btn-primary py-3 px-8 text-sm">
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <Link to="/blog/booking-com-smart-lock-automation"
                  className="inline-flex items-center justify-center gap-2 btn-secondary py-3 px-8 text-sm">
                  Read the guide
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
              How the Booking.com integration works
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {[
                {
                  icon: <Calendar size={22} />,
                  title: 'Connect your calendar',
                  desc: "Export your Booking.com iCal URL from the extranet and paste it into Propvian. Your reservations sync every 15–30 minutes.",
                },
                {
                  icon: <RefreshCw size={22} />,
                  title: 'Codes generated on sync',
                  desc: 'Each new reservation triggers a time-limited door code in TTLock. The code is valid exactly during the guest\'s stay.',
                },
                {
                  icon: <Bell size={22} />,
                  title: 'Host notifications',
                  desc: 'You get notified before each arrival with the guest name and access code. Forward it however you prefer.',
                },
                {
                  icon: <Shield size={22} />,
                  title: 'Automatic revocation',
                  desc: "At checkout, the code expires. Cancellations trigger immediate revocation on the next sync.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-5 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-platform */}
        <section className="py-14 bg-gray-50 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              List on Booking.com and Airbnb simultaneously
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Most hosts list the same property on multiple platforms. Propvian handles reservations from both Airbnb and Booking.com in the same dashboard. Each reservation gets its own unique door code regardless of which platform it came from.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {[
                'One property, multiple platforms',
                'No double-booking risk from access codes',
                'Single dashboard for all reservations',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700">
                  <Check size={13} className="text-emerald-500" /> {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={faqs} title="Booking.com Integration FAQ" />
        <CTASection title="Automate your Booking.com guest access" subtitle="Connect your Booking.com calendar and TTLock lock. Works alongside Airbnb and other platforms." />
        <MarketingFooter />
      </div>
    </>
  )
}
