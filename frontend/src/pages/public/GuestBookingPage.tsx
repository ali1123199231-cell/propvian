import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  MapPin, Star, Users, BedDouble, Bath, ChevronLeft, ChevronRight,
  CheckCircle, Loader2, CreditCard, X, AlertCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockedRange { startDate: string; endDate: string }
interface PricingRule { startDate: string; endDate: string; nightlyRate: number }
interface PropertyInfo {
  id: string; orgSlug: string; name: string; description: string; imageUrl: string
  photoUrls: string[]
  city: string; country: string; maxGuests: number; bedrooms: number; bathrooms: number
  baseNightlyRate: number; cleaningFee: number; checkInTime: string; checkOutTime: string
  cancellationPolicy: string; minStayNights: number
  stripeEnabled: boolean; paypalEnabled: boolean
  stripePublishableKey: string; paypalClientId: string
  blockedDates: BlockedRange[]; pricingRules: PricingRule[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

function fmt(d: Date) { return d.toISOString().slice(0, 10) }
function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function datesInRange(a: string, b: string): string[] {
  const out: string[] = []
  const cur = parseDate(a); const fin = parseDate(b)
  while (cur <= fin) { out.push(fmt(cur)); cur.setDate(cur.getDate() + 1) }
  return out
}
function nightsBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
}
function fmtDate(s: string) {
  return parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function getNightlyRate(pricingRules: PricingRule[], base: number, checkIn: string, checkOut: string): number {
  for (const r of pricingRules) {
    if (r.startDate <= checkIn && r.endDate >= checkOut) return r.nightlyRate
  }
  return base
}
function calcTotal(prop: PropertyInfo, checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut)
  const rate = getNightlyRate(prop.pricingRules, prop.baseNightlyRate ?? 0, checkIn, checkOut)
  const subtotal = nights * rate
  const cleaning = prop.cleaningFee ?? 0
  return { nights, rate, subtotal, cleaning, total: subtotal + cleaning }
}

// ── API ───────────────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: '' })

async function fetchProperty(slug: string): Promise<PropertyInfo> {
  const r = await api.get(`/api/public/book/${slug}`)
  return r.data.data
}
async function initiateBooking(slug: string, body: object) {
  const r = await api.post(`/api/public/book/${slug}/initiate`, body)
  return r.data.data as { bookingId: string; provider: string; stripeClientSecret?: string; paypalOrderId?: string; totalAmount: number }
}
async function confirmStripe(bookingId: string, paymentIntentId: string) {
  await api.post('/api/public/book/confirm-stripe', { bookingId, paymentIntentId })
}
async function capturePaypal(bookingId: string, orderId: string) {
  await api.post('/api/public/book/capture-paypal', { bookingId, orderId })
}

// ── Mini calendar date picker ─────────────────────────────────────────────────

function DatePicker({ prop, checkIn, checkOut, onSelect }: {
  prop: PropertyInfo
  checkIn: string | null; checkOut: string | null
  onSelect: (ci: string, co: string) => void
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selStart, setSelStart] = useState<string | null>(checkIn)
  const [selEnd, setSelEnd]     = useState<string | null>(checkOut)
  const [hover, setHover]       = useState<string | null>(null)

  const todayStr = fmt(today)

  const blockedDays = new Set<string>()
  prop.blockedDates.forEach(b => datesInRange(b.startDate, b.endDate).forEach(d => blockedDays.add(d)))

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()

  function prevMo() { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  function nextMo() { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  function handleClick(ds: string) {
    if (ds < todayStr || blockedDays.has(ds)) return
    if (!selStart || selEnd) {
      setSelStart(ds); setSelEnd(null)
    } else if (ds <= selStart) {
      setSelStart(ds); setSelEnd(null)
    } else {
      setSelEnd(ds)
      onSelect(selStart, ds)
    }
  }

  const effectiveEnd = selEnd ?? (selStart && hover && hover > selStart ? hover : null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMo} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
        <span className="font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMo} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1
          const ds  = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const past    = ds < todayStr
          const blocked = blockedDays.has(ds)
          const isStart = ds === selStart
          const isEnd   = ds === selEnd
          const inRange = !!(selStart && effectiveEnd && ds > selStart && ds < effectiveEnd)

          return (
            <button key={day}
              disabled={past || blocked}
              onClick={() => handleClick(ds)}
              onMouseEnter={() => setHover(ds)}
              onMouseLeave={() => setHover(null)}
              className={[
                'aspect-square text-xs flex items-center justify-center transition-all',
                inRange ? 'rounded-none' : 'rounded-lg',
                past || blocked  ? 'text-gray-300 cursor-not-allowed line-through' :
                isStart || isEnd ? 'bg-primary-600 text-white font-bold rounded-lg ring-2 ring-primary-400 ring-offset-1' :
                inRange          ? 'bg-primary-100 text-primary-800' :
                                   'hover:bg-primary-50 hover:text-primary-700 text-gray-700 cursor-pointer',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
      {selStart && !selEnd && (
        <p className="text-xs text-center text-primary-600 mt-3 animate-pulse">Now pick a check-out date</p>
      )}
    </div>
  )
}

// ── Stripe payment form ───────────────────────────────────────────────────────

function StripePaymentForm({ clientSecret, bookingId, onSuccess }: {
  clientSecret: string; bookingId: string; onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    setLoading(true); setError(null)
    const card = elements.getElement(CardElement)
    if (!card) return
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    })
    setLoading(false)
    if (result.error) {
      setError(result.error.message ?? 'Payment failed')
    } else if (result.paymentIntent?.status === 'succeeded') {
      try {
        await confirmStripe(bookingId, result.paymentIntent.id)
      } catch { /* webhook will confirm if this fails */ }
      onSuccess()
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <CardElement options={{
          style: { base: { fontSize: '15px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } } }
        }} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={handlePay} disabled={loading || !stripe}
        className="w-full btn-primary py-3 justify-center text-base font-bold">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
        {loading ? 'Processing…' : 'Pay now'}
      </button>
    </div>
  )
}

// ── Main booking page ─────────────────────────────────────────────────────────

export function GuestBookingPage({ slug }: { slug: string }) {
  const [step, setStep] = useState<'dates' | 'info' | 'payment' | 'done'>('dates')
  const [checkIn, setCheckIn]   = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [guestName, setGuestName]   = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guests, setGuests]         = useState(1)
  const [payProvider, setPayProvider] = useState<'stripe' | 'paypal'>('stripe')
  const [promoInput, setPromoInput]   = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountType: string; discountValue: number; message: string } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError]     = useState<string | null>(null)

  const [initiated, setInitiated] = useState<{ bookingId: string; stripeClientSecret?: string; paypalOrderId?: string; paypalClientId?: string } | null>(null)
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)

  const { data: prop, isLoading, error: propError } = useQuery({
    queryKey: ['guest-property', slug],
    queryFn: () => fetchProperty(slug),
  })

  useEffect(() => {
    if (prop?.stripeEnabled && prop.stripePublishableKey && !stripePromise) {
      setStripePromise(loadStripe(prop.stripePublishableKey))
    }
    if (prop?.stripeEnabled) setPayProvider('stripe')
    else if (prop?.paypalEnabled) setPayProvider('paypal')
  }, [prop])

  const initMut = useMutation({
    mutationFn: () => initiateBooking(slug, {
      guestName, guestEmail, guestPhone,
      checkInDate: checkIn, checkOutDate: checkOut,
      numberOfGuests: guests,
      paymentProvider: payProvider,
      promoCode: promoApplied?.code ?? undefined,
    }),
    onSuccess: (data) => {
      setInitiated({
        bookingId: data.bookingId,
        stripeClientSecret: data.stripeClientSecret,
        paypalOrderId: data.paypalOrderId,
        paypalClientId: prop?.paypalClientId,
      })
      setStep('payment')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Could not start checkout'),
  })

  async function applyPromo() {
    if (!promoInput.trim() || !prop?.orgSlug) return
    setPromoLoading(true); setPromoError(null)
    try {
      const res = await api.get(`/api/public/promo/${prop.orgSlug}/${encodeURIComponent(promoInput.trim())}`)
      const d = res.data.data
      if (d.valid) {
        setPromoApplied({ code: d.code, discountType: d.discountType, discountValue: Number(d.discountValue), message: d.message })
        setPromoError(null)
        toast.success(d.message)
      } else {
        setPromoApplied(null)
        setPromoError(d.message || 'Invalid promo code')
      }
    } catch {
      setPromoError('Could not validate promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  )

  if (propError || !prop) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Property not found.
    </div>
  )

  const pricing = checkIn && checkOut ? calcTotal(prop, checkIn, checkOut) : null

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking confirmed!</h1>
        <p className="text-gray-500 mb-6">
          A confirmation has been sent to <strong>{guestEmail}</strong>.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium">{prop.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-medium">{fmtDate(checkIn!)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-medium">{fmtDate(checkOut!)}</span></div>
          {pricing && <div className="flex justify-between border-t border-gray-100 pt-2 mt-2"><span className="text-gray-700 font-semibold">Total paid</span><span className="font-bold text-primary-700">${pricing.total.toFixed(2)}</span></div>}
        </div>
        <p className="text-xs text-gray-400 mt-6">{prop.checkInTime ? `Check-in from ${prop.checkInTime}` : ''} {prop.checkOutTime ? `· Check-out by ${prop.checkOutTime}` : ''}</p>
      </div>
    </div>
  )

  const photos = prop.photoUrls?.length ? prop.photoUrls : (prop.imageUrl ? [prop.imageUrl] : [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Photo Gallery */}
      <div className="relative bg-gray-900">
        {/* Main photo */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          {photos.length > 0 ? (
            <img
              src={photos[activePhoto]}
              alt={prop.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <MapPin size={48} className="text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Prev/next */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {/* Photo count */}
          {photos.length > 1 && (
            <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {activePhoto + 1} / {photos.length}
            </span>
          )}
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-bold drop-shadow-md">{prop.name}</h1>
            {(prop.city || prop.country) && (
              <div className="flex items-center gap-1 mt-1.5 text-white/85 text-sm">
                <MapPin size={13} />{[prop.city, prop.country].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-gray-900 overflow-x-auto scrollbar-none">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-80'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Left: property details ────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Specs */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {prop.maxGuests  && <span className="flex items-center gap-1.5"><Users size={15} />{prop.maxGuests} guests</span>}
            {prop.bedrooms   && <span className="flex items-center gap-1.5"><BedDouble size={15} />{prop.bedrooms} bed{prop.bedrooms !== 1 ? 's' : ''}</span>}
            {prop.bathrooms  && <span className="flex items-center gap-1.5"><Bath size={15} />{prop.bathrooms} bath{prop.bathrooms !== 1 ? 's' : ''}</span>}
          </div>

          {prop.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{prop.description}</p>
          )}

          {/* Cancellation */}
          {prop.cancellationPolicy && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>Cancellation:</strong> {prop.cancellationPolicy}
            </div>
          )}

          {/* Check-in / out times */}
          {(prop.checkInTime || prop.checkOutTime) && (
            <div className="flex gap-6 text-sm text-gray-500">
              {prop.checkInTime  && <span>Check-in from <strong>{prop.checkInTime}</strong></span>}
              {prop.checkOutTime && <span>Check-out by <strong>{prop.checkOutTime}</strong></span>}
            </div>
          )}
        </div>

        {/* ── Right: booking flow ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1: dates */}
          {step === 'dates' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-1">
                {prop.baseNightlyRate ? `$${prop.baseNightlyRate} / night` : 'Select dates'}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                {prop.minStayNights > 1 ? `${prop.minStayNights} night minimum · ` : ''}Click to select your dates
              </p>
              <DatePicker prop={prop} checkIn={checkIn} checkOut={checkOut}
                onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co) }} />

              {checkIn && checkOut && pricing && (() => {
                const belowMin = prop.minStayNights > 1 && pricing.nights < prop.minStayNights
                const noRate = !prop.baseNightlyRate
                return (
                  <>
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
                      {noRate ? (
                        <p className="text-amber-600 text-xs font-medium">No nightly rate set — this property cannot be booked yet.</p>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>${pricing.rate} × {pricing.nights} night{pricing.nights !== 1 ? 's' : ''}</span>
                            <span>${pricing.subtotal.toFixed(2)}</span>
                          </div>
                          {pricing.cleaning > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Cleaning fee</span><span>${pricing.cleaning.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                            <span>Total</span><span>${pricing.total.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {belowMin && (
                      <p className="text-xs text-red-500 mt-2">
                        Minimum stay is {prop.minStayNights} nights. You selected {pricing.nights}.
                      </p>
                    )}
                    <button
                      onClick={() => setStep('info')}
                      disabled={belowMin || noRate}
                      className="mt-4 w-full btn-primary py-3 justify-center text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                      Continue
                    </button>
                  </>
                )
              })()}
            </div>
          )}

          {/* Step 2: guest info */}
          {step === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Your details</h2>
                <button onClick={() => setStep('dates')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <ChevronLeft size={13} /> Change dates
                </button>
              </div>

              {/* Booking summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><span>{fmtDate(checkIn!)} → {fmtDate(checkOut!)}</span><span>{pricing?.nights} nights</span></div>
                {promoApplied && pricing && (() => {
                  const discountAmt = promoApplied.discountType === 'PERCENT'
                    ? pricing.total * promoApplied.discountValue / 100
                    : promoApplied.discountValue
                  const discountedTotal = Math.max(0, pricing.total - discountAmt)
                  return (
                    <>
                      <div className="flex justify-between text-emerald-600">
                        <span>Promo ({promoApplied.code})</span>
                        <span>-${discountAmt.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900"><span>Total</span><span>${discountedTotal.toFixed(2)}</span></div>
                    </>
                  )
                })()}
                {!promoApplied && <div className="flex justify-between font-semibold text-gray-900"><span>Total</span><span>${pricing?.total.toFixed(2)}</span></div>}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)}
                    className="input-base text-sm w-full" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                    type="email" className="input-base text-sm w-full" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                    type="tel" className="input-base text-sm w-full" placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    className="input-base text-sm w-full">
                    {[...Array(prop.maxGuests || 10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Promo code */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Promo code</p>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoApplied(null); setPromoError(null) }}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    placeholder="Enter code"
                    disabled={!!promoApplied}
                    className="input-base text-sm flex-1 uppercase tracking-widest disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {promoApplied ? (
                    <button onClick={() => { setPromoApplied(null); setPromoInput(''); setPromoError(null) }}
                      className="px-3 rounded-xl border-2 border-gray-200 text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-all">
                      ✕
                    </button>
                  ) : (
                    <button onClick={applyPromo} disabled={!promoInput.trim() || promoLoading}
                      className="px-4 rounded-xl border-2 border-primary-300 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-all disabled:opacity-40">
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>
                {promoApplied && (
                  <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ {promoApplied.message}</p>
                )}
                {promoError && (
                  <p className="text-xs text-red-500 mt-1.5">{promoError}</p>
                )}
              </div>

              {/* Payment method selector */}
              {(prop.stripeEnabled || prop.paypalEnabled) ? (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Payment method</p>
                  <div className="flex gap-2">
                    {prop.stripeEnabled && (
                      <button onClick={() => setPayProvider('stripe')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${payProvider === 'stripe' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        💳 Card
                      </button>
                    )}
                    {prop.paypalEnabled && (
                      <button onClick={() => setPayProvider('paypal')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${payProvider === 'paypal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <span className="font-bold text-blue-600">Pay</span><span className="font-bold text-blue-400">Pal</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-snug">
                    Online booking is not available yet for this property. The host's account is pending verification. Please contact the host directly to arrange your stay.
                  </p>
                </div>
              )}

              {(prop.stripeEnabled || prop.paypalEnabled) && (
                <button
                  onClick={() => initMut.mutate()}
                  disabled={!guestName.trim() || !guestEmail.trim() || initMut.isPending}
                  className="w-full btn-primary py-3 justify-center text-base font-bold">
                  {initMut.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                  {initMut.isPending ? 'Starting checkout…' : 'Continue to payment'}
                </button>
              )}
            </div>
          )}

          {/* Step 3: payment */}
          {step === 'payment' && initiated && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Payment</h2>
                <button onClick={() => { setStep('info'); setInitiated(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <X size={13} /> Back
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><span>{prop.name}</span><span>{pricing?.nights} nights</span></div>
                <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>${pricing?.total.toFixed(2)}</span></div>
              </div>

              {/* Stripe */}
              {payProvider === 'stripe' && initiated.stripeClientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret: initiated.stripeClientSecret }}>
                  <StripePaymentForm
                    clientSecret={initiated.stripeClientSecret}
                    bookingId={initiated.bookingId}
                    onSuccess={() => setStep('done')}
                  />
                </Elements>
              )}

              {/* PayPal */}
              {payProvider === 'paypal' && prop.paypalClientId && (
                <PayPalScriptProvider options={{ clientId: prop.paypalClientId, currency: 'USD' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                    createOrder={() => Promise.resolve(initiated.paypalOrderId!)}
                    onApprove={async (data) => {
                      try {
                        await capturePaypal(initiated.bookingId, data.orderID)
                        setStep('done')
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Payment capture failed')
                      }
                    }}
                    onError={() => toast.error('PayPal error. Please try again.')}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
