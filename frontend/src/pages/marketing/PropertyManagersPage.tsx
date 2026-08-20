import { Link } from 'react-router-dom'
import { CalendarCheck, CreditCard, Globe2, KeyRound, ArrowRight, Check, X } from 'lucide-react'
import { PropvianLogo } from '@/components/PropvianLogo'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { FAQSection, type FAQItem } from '@/components/marketing/FAQSection'
import { SEOHead } from '@/components/seo/SEOHead'
import { useCalInline, calBookingUrl } from '@/lib/calcom'

const CAL_ELEMENT_ID = 'propvian-cal-inline'

/**
 * Landing page for outbound batch #1 — the destination for the cold-email
 * sequence in docs/marketing/outbound-batch-1.md.
 *
 * Deliberately noIndex: it is written for someone who already got the email and
 * knows why they are here. Letting it into the index would put a page with a
 * "book a call" as its only real action into search results that /pricing and
 * the comparison pages are built to win.
 */

const faqs: FAQItem[] = [
  {
    question: 'Do I have to leave Airbnb or Booking.com?',
    answer:
      'No, and most hosts should not. Propvian pulls availability from the OTA calendars you already run, so your direct site never double-books against them. The goal is to stop paying commission on the guests who were coming to you anyway — repeat visitors, referrals, and people who found you on Google.',
  },
  {
    question: 'How long does setup actually take?',
    answer:
      'An afternoon for a handful of properties. You paste your Airbnb and Booking.com iCal links, pick a template, and pull in your existing photos and descriptions. Connecting Stripe is the slowest part, and that is Stripe verifying you, not us.',
  },
  {
    question: 'Do I need smart locks?',
    answer:
      'No. Direct booking works on its own. If you do run TTLock locks, Propvian can generate and expire a door code per reservation automatically. TTLock is the only lock brand supported today.',
  },
  {
    question: 'What happens to the website I already have?',
    answer:
      'Keep it. Most managers point a subdomain such as book.yoursite.com at Propvian and link to it from their existing site, so the pages you have already ranked stay exactly as they are.',
  },
  {
    question: 'Who holds the guest money?',
    answer:
      'You do. Payments go through your own Stripe or PayPal account, straight to your bank. Propvian never touches the funds and never takes a percentage of a booking.',
  },
  {
    question: 'What does it cost?',
    answer:
      'Ten dollars per active property per month, billed monthly. Add a property and it bills $10, remove it and billing stops. The first month is free and no card is required to start.',
  },
]

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-50 text-primary-600">{icon}</span>
        <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Step {n}</span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}

export function PropertyManagersPage() {
  const calStatus = useCalInline(CAL_ELEMENT_ID)

  return (
    <>
      <SEOHead
        title="Direct Bookings for Property Managers"
        description="Turn the website you already have into a real booking engine. Live availability from your Airbnb and Booking.com calendars, guests pay your own Stripe, 0% commission. $10 per property per month."
        noIndex
      />

      <div className="min-h-screen flex flex-col bg-white">
        {/* Slim header — one action, no nav menu to wander off into. */}
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" aria-label="Propvian home">
              <PropvianLogo size={28} />
            </Link>
            <a
              href="#book"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Book a 15-min call
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="px-4 sm:px-6 pt-14 pb-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-primary-600 uppercase tracking-widest font-semibold mb-4">
              For managers running 5+ short-term rentals
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Your website gets the visit.<br />Airbnb gets the booking.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Propvian turns the site you already have into a real booking engine — live availability pulled from your
              Airbnb and Booking.com calendars, and guests paying directly into your own Stripe account. Flat{' '}
              <strong className="text-gray-900">$10 per property per month</strong>. No commission on a booking, ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-base"
              >
                Book a 15-minute call <ArrowRight size={18} />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-bold rounded-xl border border-primary-200 hover:bg-primary-50 transition-colors text-base"
              >
                See a live demo site
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-5">
              First month free · No card required · Cancel any time
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 sm:px-6 py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
              Three things, then you are taking direct bookings
            </h2>
            <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
              No developer, no migration, and nothing to rip out of the setup you run today.
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              <Step n={1} icon={<CalendarCheck size={18} />} title="Connect your calendars">
                Paste the iCal links from Airbnb and Booking.com so their bookings block your direct site. Propvian gives
                each property a feed of its own — paste that back into the OTAs, and direct bookings block them too.
              </Step>
              <Step n={2} icon={<Globe2 size={18} />} title="Publish your booking page">
                Pick a template, pull in your photos and descriptions, put it on your own domain. It is a builder, not a
                blank page — most managers are live the same afternoon.
              </Step>
              <Step n={3} icon={<CreditCard size={18} />} title="Get paid directly">
                Connect your own Stripe or PayPal. The guest's card is charged into your account, not ours. We never
                hold the money and never take a cut.
              </Step>
            </div>
          </div>
        </section>

        {/* The maths */}
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">Where the money goes</h2>
            <p className="text-sm text-gray-500 text-center mb-10">
              On a $1,000 stay, booked two ways.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-200 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Through an OTA</p>
                <p className="text-3xl font-extrabold text-gray-900 mb-1">≈ $820–870</p>
                <p className="text-sm text-gray-500 mb-5">reaches you</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><X size={16} className="text-gray-400 shrink-0 mt-0.5" />Booking.com commission is typically 15–18%</li>
                  <li className="flex gap-2"><X size={16} className="text-gray-400 shrink-0 mt-0.5" />Airbnb takes ~3% from you and ~14% from the guest, or ~15% from you on host-only pricing</li>
                  <li className="flex gap-2"><X size={16} className="text-gray-400 shrink-0 mt-0.5" />The guest fee inflates your headline price, so you look dearer than you are</li>
                  <li className="flex gap-2"><X size={16} className="text-gray-400 shrink-0 mt-0.5" />You do not get the guest's real email address</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/40 p-6">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4">Direct, through Propvian</p>
                <p className="text-3xl font-extrabold text-gray-900 mb-1">≈ $960</p>
                <p className="text-sm text-gray-500 mb-5">reaches you</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><Check size={16} className="text-primary-600 shrink-0 mt-0.5" />0% commission to Propvian</li>
                  <li className="flex gap-2"><Check size={16} className="text-primary-600 shrink-0 mt-0.5" />Card processing still applies — roughly 1.5–2.9% + a fixed fee, charged by Stripe, not us</li>
                  <li className="flex gap-2"><Check size={16} className="text-primary-600 shrink-0 mt-0.5" />$10/month for that property, whether it books once or thirty times</li>
                  <li className="flex gap-2"><Check size={16} className="text-primary-600 shrink-0 mt-0.5" />The guest's email is yours, so the next stay costs you nothing to win</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-6 max-w-xl mx-auto">
              OTA percentages are the published ranges at the time of writing and vary by market, property and plan —
              check your own statements for your exact numbers.
            </p>
          </div>
        </section>

        {/* Honesty section */}
        <section className="px-4 sm:px-6 py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">What Propvian is not</h2>
            <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
              Worth knowing before a call, so neither of us wastes the fifteen minutes.
            </p>
            <div className="space-y-3">
              {[
                [
                  'Not a full channel manager',
                  'Calendar sync is iCal-based. It moves availability, not rates and content. If your job to be done is pushing nightly rates to six OTAs at once, Hostaway or Guesty fit better and we will say so.',
                ],
                [
                  'Not a replacement for the OTAs',
                  'Airbnb and Booking.com are excellent at finding you guests who have never heard of you. Direct booking is for the ones who already have.',
                ],
                [
                  'Not a fit for a single property',
                  'It works, but the maths is thin. This is built for portfolios where a few points of commission is real money.',
                ],
                [
                  'TTLock only, for now',
                  'The automatic per-reservation door codes work with TTLock hardware. Other lock brands are not supported yet.',
                ],
              ].map(([title, body]) => (
                <div key={title} className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="px-4 sm:px-6 py-16 scroll-mt-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-600 mb-5">
              <KeyRound size={20} />
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">See one that is actually live</h2>
            <p className="text-base text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
              A real Propvian booking site, built with the same builder you would use — three properties, live availability,
              and the guest-facing pages exactly as your visitors would see them.
            </p>
            <a
              href="/sites/harbour-lane-stays"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Open the demo site <ArrowRight size={18} />
            </a>
            <p className="text-xs text-gray-400 mt-4">Opens in a new tab. It is a demo portfolio, not a real business.</p>
          </div>
        </section>

        {/* Booking */}
        <section id="book" className="px-4 sm:px-6 py-16 bg-gray-50 scroll-mt-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">Fifteen minutes, no pitch deck</h2>
            <p className="text-sm text-gray-500 text-center mb-4 max-w-xl mx-auto">
              I am the founder. Tell me how you take bookings today and I will tell you honestly whether this is worth
              your time — including when it is not.
            </p>
            {calStatus !== 'failed' && (
              <p className="text-center mb-8">
                <a href={calBookingUrl()} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Prefer a full page? Open the calendar directly
                </a>
              </p>
            )}

            {/* Kept mounted so Cal always has a stable target to resolve; hidden
                rather than unmounted once we know it will never come up. */}
            <div
              id={CAL_ELEMENT_ID}
              className={
                calStatus === 'failed'
                  ? 'hidden'
                  : 'min-h-[560px] rounded-2xl bg-white border border-gray-200 overflow-hidden'
              }
            />

            {calStatus === 'failed' && (
              <div className="rounded-2xl bg-white border border-gray-200 px-6 py-12 text-center">
                <p className="text-base font-semibold text-gray-900 mb-2">The calendar didn't load</p>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
                  Usually a script blocker. Open the booking page directly, or just reply to the email that brought you
                  here — it reaches me either way.
                </p>
                <a
                  href={calBookingUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Open the booking page <ArrowRight size={18} />
                </a>
              </div>
            )}
          </div>
        </section>

        <FAQSection items={faqs} title="Questions worth asking first" />

        <MarketingFooter />
      </div>
    </>
  )
}
