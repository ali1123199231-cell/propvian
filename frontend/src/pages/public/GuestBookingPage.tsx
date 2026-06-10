import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import {
  MapPin, Star, Users, BedDouble, Bath, ChevronLeft, ChevronRight,
  CheckCircle, Loader2, CreditCard, X, AlertCircle,
} from 'lucide-react'
import { logger } from '../../lib/logger'

const log = logger.child('GUEST')

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockedRange { startDate: string; endDate: string }
interface PricingRule { startDate: string; endDate: string; nightlyRate: number }
interface SeasonalRule { startDate: string; endDate: string; minStayNights?: number; maxStayNights?: number }
interface HouseRuleInfo { ruleKey: string; allowed: boolean; notes?: string }
interface AmenityInfo  { category: string; name: string; icon?: string }

interface PropertyInfo {
  id: string; orgSlug: string; name: string; description: string; imageUrl: string
  photoUrls: string[]
  city: string; country: string; maxGuests: number; bedrooms: number; beds?: number; bathrooms: number
  propertyType?: string; currency?: string
  baseNightlyRate: number; cleaningFee: number; securityDeposit?: number; checkInTime: string; checkOutTime: string
  cancellationPolicy: string; minStayNights: number; maxStayNights?: number; instantBooking: boolean
  depositRequired?: boolean; depositPercent?: number
  bookingsEnabled: boolean
  customDomain?: string
  stripeEnabled: boolean; paypalEnabled: boolean
  stripePublishableKey: string; stripeConnectedAccountId: string; paypalClientId: string
  hasActivePromos: boolean
  houseRules?: HouseRuleInfo[]
  amenities?: AmenityInfo[]
  // Org branding
  brandName?: string; brandLogoUrl?: string
  primaryColor?: string; accentColor?: string; fontFamily?: string; buttonStyle?: string
  blockedDates: BlockedRange[]
  pricingRules: PricingRule[]
  seasonalRules?: SeasonalRule[]
}

const _hostname = window.location.hostname
const _isOnPropvianSubdomain = !['propvian.com', 'www.propvian.com', 'localhost', '127.0.0.1'].includes(_hostname)
  && !_hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
  && _hostname.endsWith('.propvian.com')

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
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
function fmtCancellationPolicy(raw: string): string {
  const map: Record<string, string> = {
    NON_REFUNDABLE: 'Non-Refundable — no refund for cancellations',
    FLEXIBLE: 'Flexible — full refund if cancelled 24h before check-in',
    MODERATE: 'Moderate — full refund if cancelled 5 days before check-in',
    STRICT: 'Strict — 50% refund if cancelled 7 days before check-in',
  }
  return map[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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
function fmtPrice(amount: number, currency?: string): string {
  const cur = currency && currency.length === 3 ? currency.toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amount)
  } catch {
    return `${cur} ${amount.toFixed(2)}`
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: '' })

async function fetchProperty(slug: string): Promise<PropertyInfo> {
  log.info(`Fetching property slug='${slug}'`)
  const r = await api.get(`/api/public/book/${slug}`)
  const p: PropertyInfo = r.data.data

  // ── Booking page section sync audit ────────────────────────────────────
  log.info(`[booking-page] ── Section data audit for '${p.name}' ──`)
  log.info(`[hero]         photos=${p.photoUrls?.length ?? 0} | imageUrl=${p.imageUrl ? 'set' : 'null'}`)
  log.info(`[name/title]   '${p.name}' | city='${p.city}' country='${p.country}'`)
  log.info(`[specs]        guests=${p.maxGuests} beds=${p.bedrooms} bathrooms=${p.bathrooms} instantBook=${p.instantBooking}`)
  log.info(`[description]  ${p.description ? `${p.description.length} chars: '${p.description.substring(0, 60)}…'` : '⚠️ EMPTY — section hidden'}`)
  log.info(`[checkin]      checkIn='${p.checkInTime || '⚠️ not set'}' checkOut='${p.checkOutTime || '⚠️ not set'}'`)
  log.info(`[cancellation] policy='${p.cancellationPolicy || '⚠️ not set'}'`)
  log.info(`[amenities]    ${p.amenities?.length ? `${p.amenities.length} items: ${p.amenities.map(a => a.name).join(', ')}` : '⚠️ EMPTY — section hidden'}`)
  log.info(`[house-rules]  ${p.houseRules?.length ? `${p.houseRules.length} rules: ${p.houseRules.map(r => `${r.ruleKey}=${r.allowed}`).join(', ')}` : '⚠️ EMPTY — section hidden'}`)
  log.info(`[pricing]      rate=${p.baseNightlyRate ?? '⚠️ not set'} cleaning=${p.cleaningFee ?? 0} currency=${p.currency}`)
  log.info(`[payments]     stripe=${p.stripeEnabled} paypal=${p.paypalEnabled} bookingsEnabled=${p.bookingsEnabled}`)

  return p
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
  onSelect: (ci: string, co: string | null) => void
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

  function rangeSpansBlocked(start: string, end: string) {
    const dates = datesInRange(start, end)
    return dates.some(d => d !== start && d !== end && blockedDays.has(d))
  }

  function handleClick(ds: string) {
    if (ds < todayStr || blockedDays.has(ds)) return
    if (!selStart || selEnd) {
      setSelStart(ds); setSelEnd(null); onSelect(ds, null)
    } else if (ds <= selStart) {
      setSelStart(ds); setSelEnd(null); onSelect(ds, null)
    } else if (rangeSpansBlocked(selStart, ds)) {
      // Range crosses a blocked period — restart selection from this date
      setSelStart(ds); setSelEnd(null); onSelect(ds, null)
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
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountType: string; discountValue: number; minNights?: number; message: string } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError]     = useState<string | null>(null)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [initiated, setInitiated] = useState<{ bookingId: string; stripeClientSecret?: string; paypalOrderId?: string; paypalClientId?: string } | null>(null)
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)

  const { data: prop, isLoading, error: propError } = useQuery({
    queryKey: ['guest-property', slug],
    queryFn: () => fetchProperty(slug),
    retry: false,
  })

  useEffect(() => {
    if (prop?.stripeEnabled && prop.stripePublishableKey && !stripePromise) {
      setStripePromise(loadStripe(prop.stripePublishableKey, { stripeAccount: prop.stripeConnectedAccountId }))
    }
    if (prop?.stripeEnabled) setPayProvider('stripe')
    else if (prop?.paypalEnabled) setPayProvider('paypal')
  }, [prop])

  // Update browser title and SEO meta from property data
  useEffect(() => {
    if (!prop) return
    const title = prop.brandName ? `${prop.name} — ${prop.brandName}` : prop.name
    document.title = title
    const setMeta = (name: string, content: string, isProp = false) => {
      const sel = isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let el = document.querySelector(sel) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        isProp ? el.setAttribute('property', name) : el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    const desc = prop.description || `Book ${prop.name} directly. ${prop.city ? `Located in ${prop.city}` : ''}`.trim()
    setMeta('description', desc)
    setMeta('og:title', title, true)
    setMeta('twitter:title', title, true)
    setMeta('og:description', desc, true)
    setMeta('twitter:description', desc, true)
    if (prop.brandName) setMeta('og:site_name', prop.brandName, true)
    const image = prop.photoUrls?.[0] || prop.imageUrl
    if (image) { setMeta('og:image', image, true); setMeta('twitter:image', image, true) }
    const currentUrl = window.location.href
    setMeta('og:url', currentUrl, true)
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', currentUrl)
  }, [prop])

  const fieldLabels: Record<string, string> = {
    guestName: 'Full name', guestEmail: 'Email', guestPhone: 'Phone',
    checkInDate: 'Check-in date', checkOutDate: 'Check-out date',
    numberOfGuests: 'Number of guests', paymentProvider: 'Payment method',
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!guestName.trim()) errors.guestName = 'Full name is required'
    if (!guestEmail.trim()) {
      errors.guestEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      errors.guestEmail = 'Please enter a valid email address'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const initMut = useMutation({
    mutationFn: () => initiateBooking(slug, {
      guestName, guestEmail, guestPhone,
      checkInDate: checkIn, checkOutDate: checkOut,
      numberOfGuests: guests,
      paymentProvider: payProvider,
      promoCode: promoApplied?.code ?? undefined,
    }),
    onSuccess: (data) => {
      setFormErrors({})
      setInitiated({
        bookingId: data.bookingId,
        stripeClientSecret: data.stripeClientSecret,
        paypalOrderId: data.paypalOrderId,
        paypalClientId: prop?.paypalClientId,
      })
      setStep('payment')
    },
    onError: (e: any) => {
      const data = e.response?.data
      const serverFieldErrors: Record<string, string> | undefined = data?.fieldErrors
      if (serverFieldErrors && Object.keys(serverFieldErrors).length > 0) {
        setFormErrors(serverFieldErrors)
        const msg = Object.entries(serverFieldErrors)
          .map(([f, m]) => `${fieldLabels[f] ?? f}: ${m}`)
          .join('\n')
        toast.error(msg, { duration: 6000 })
      } else {
        toast.error(data?.message || 'Could not start checkout', { duration: 6000 })
      }
    },
  })

  async function applyPromo() {
    if (!promoInput.trim() || !prop?.orgSlug) return
    setPromoLoading(true); setPromoError(null)
    try {
      const res = await api.get(`/api/public/promo/${prop.orgSlug}/${encodeURIComponent(promoInput.trim())}`)
      const d = res.data.data
      if (d.valid) {
        setPromoApplied({ code: d.code, discountType: d.discountType, discountValue: Number(d.discountValue), minNights: d.minNights ?? undefined, message: d.message })
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
  const primary = prop.primaryColor || '#6366F1'
  const accent  = prop.accentColor  || '#F59E0B'
  const font    = prop.fontFamily   || 'Inter'
  const btnRadius = prop.buttonStyle === 'pill' ? '999px' : prop.buttonStyle === 'square' ? '3px' : '10px'
  const btnStyle = { backgroundColor: primary, borderRadius: btnRadius }
  const brandName = prop.brandName || prop.name

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${primary}15, white)`, fontFamily: font }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Booking confirmed!</h1>
        <p className="text-gray-500 mb-6">A confirmation has been sent to <strong>{guestEmail}</strong>.</p>
        <div className="rounded-2xl p-5 text-left space-y-2.5 text-sm" style={{ backgroundColor: `${primary}0d` }}>
          <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-semibold text-gray-800">{prop.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-semibold text-gray-800">{fmtDate(checkIn!)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-semibold text-gray-800">{fmtDate(checkOut!)}</span></div>
          {pricing && (
            <div className="flex justify-between border-t border-gray-200 pt-2.5 mt-1">
              <span className="font-bold text-gray-700">Total paid</span>
              <span className="font-extrabold text-lg" style={{ color: primary }}>{fmtPrice(pricing.total, prop.currency)}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-5">
          {prop.checkInTime ? `Check-in from ${prop.checkInTime}` : ''}
          {prop.checkInTime && prop.checkOutTime ? ' · ' : ''}
          {prop.checkOutTime ? `Check-out by ${prop.checkOutTime}` : ''}
        </p>
        <p className="text-xs font-semibold mt-4" style={{ color: primary }}>{brandName}</p>
      </div>
    </div>
  )

  const photos = prop.photoUrls?.length ? prop.photoUrls : (prop.imageUrl ? [prop.imageUrl] : [])

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: font }}>
      <Toaster position="top-center" toastOptions={{ duration: 6000 }} />

      {/* ── Branded navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {prop.brandLogoUrl ? (
              <img src={prop.brandLogoUrl} alt={brandName} className="h-9 w-auto object-contain max-w-[160px]" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: `linear-gradient(135deg, ${primary}, ${accent}99)` }}>
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-gray-900 text-base sm:text-lg truncate max-w-[200px]">{brandName}</span>
          </div>
          <div className="flex items-center gap-2">
            {prop.orgSlug && (
              <a href={`/`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                <ChevronLeft size={15} /> All properties
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero photo gallery ───────────────────────────────────────────────── */}
      <div className="relative" style={{ backgroundColor: primary }}>
        <div className="relative overflow-hidden" style={{ height: photos.length > 0 ? '480px' : '240px' }}>
          {photos.length > 0 ? (
            <img src={photos[activePhoto]} alt={prop.name}
              className="w-full h-full object-cover transition-opacity duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent}99)` }}>
              <MapPin size={48} className="text-white/50" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)` }} />

          {photos.length > 1 && (
            <>
              <button onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all">
                <ChevronRight size={20} />
              </button>
              <span className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                {activePhoto + 1} / {photos.length}
              </span>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-sm mb-2">{prop.name}</h1>
              {(prop.city || prop.country) && (
                <div className="flex items-center gap-1.5 text-white/85 text-sm font-medium">
                  <MapPin size={14} />{[prop.city, prop.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 px-4 sm:px-8 py-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-none max-w-none">
            {photos.map((url, i) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === activePhoto ? 'opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-75'}`}
                style={i === activePhoto ? { borderColor: primary } : {}}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Left: property details ──────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-8">

          {/* Specs pills */}
          <div className="flex flex-wrap gap-3">
            {prop.maxGuests  && (
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${primary}12`, color: primary }}>
                <Users size={15} />{prop.maxGuests} guest{prop.maxGuests !== 1 ? 's' : ''}
              </span>
            )}
            {prop.bedrooms   && (
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${primary}12`, color: primary }}>
                <BedDouble size={15} />{prop.bedrooms} bedroom{prop.bedrooms !== 1 ? 's' : ''}
              </span>
            )}
            {prop.beds && (
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${primary}12`, color: primary }}>
                <BedDouble size={15} />{prop.beds} bed{prop.beds !== 1 ? 's' : ''}
              </span>
            )}
            {prop.bathrooms  && (
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${primary}12`, color: primary }}>
                <Bath size={15} />{prop.bathrooms} bath{prop.bathrooms !== 1 ? 's' : ''}
              </span>
            )}
            {prop.instantBooking && (
              <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700">
                ⚡ Instant Book
              </span>
            )}
          </div>

          {/* Description */}
          {prop.description && (
            <div>
              <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: accent }} />
              <p className="text-gray-600 leading-relaxed text-base">{prop.description}</p>
            </div>
          )}

          {/* Check-in / Check-out */}
          {(prop.checkInTime || prop.checkOutTime) && (
            <div className="grid grid-cols-2 gap-4">
              {prop.checkInTime && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                  <p className="font-bold text-gray-900">From {prop.checkInTime}</p>
                </div>
              )}
              {prop.checkOutTime && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                  <p className="font-bold text-gray-900">By {prop.checkOutTime}</p>
                </div>
              )}
            </div>
          )}

          {/* Cancellation */}
          {prop.cancellationPolicy && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900">
              <strong className="font-semibold">Cancellation policy:</strong> {fmtCancellationPolicy(prop.cancellationPolicy)}
            </div>
          )}

          {/* Amenities */}
          {prop.amenities && prop.amenities.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What's included</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {prop.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    {a.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House rules */}
          {prop.houseRules && prop.houseRules.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">House rules</p>
              <div className="space-y-1.5">
                {prop.houseRules.map((r, i) => {
                  const label = r.ruleKey === 'PETS' ? 'Pets' : r.ruleKey === 'SMOKING' ? 'Smoking' :
                    r.ruleKey === 'PARTIES' ? 'Parties / events' : r.ruleKey === 'QUIET_HOURS' ? 'Quiet hours' :
                    r.ruleKey === 'CHILDREN' ? 'Children' : r.ruleKey.replace(/_/g, ' ')
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={r.allowed ? 'text-emerald-600' : 'text-red-500'}>{r.allowed ? '✓' : '✕'}</span>
                      <span className={r.allowed ? 'text-gray-700' : 'text-gray-500 line-through-subtle'}>
                        {label}{r.allowed ? ' allowed' : ' not allowed'}
                      </span>
                      {r.notes && <span className="text-xs text-gray-400 ml-1">({r.notes})</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: booking flow ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">

          {!prop.bookingsEnabled && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Bookings temporarily unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">Online booking is currently disabled for this property. Please contact the host directly.</p>
              </div>
            </div>
          )}

          {/* Step 1: dates */}
          {step === 'dates' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-extrabold text-gray-900 text-xl">
                  {prop.baseNightlyRate ? <>{fmtPrice(prop.baseNightlyRate, prop.currency)}<span className="text-sm font-normal text-gray-400"> / night</span></> : 'Select dates'}
                </h2>
                {prop.minStayNights > 1 && <span className="text-xs text-gray-400">{prop.minStayNights} night min</span>}
                {prop.maxStayNights && prop.maxStayNights < 365 && <span className="text-xs text-gray-400">{prop.maxStayNights} night max</span>}
              </div>
              <p className="text-xs text-gray-400 mb-5">Click a date to start your selection</p>
              <DatePicker prop={prop} checkIn={checkIn} checkOut={checkOut}
                onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co) }} />

              {checkIn && checkOut && pricing && (() => {
                const activeSeasonalRule = prop.seasonalRules?.find(r => r.startDate <= checkIn && r.endDate >= checkIn)
                const effectiveMin = activeSeasonalRule?.minStayNights ?? prop.minStayNights
                const effectiveMax = activeSeasonalRule?.maxStayNights ?? prop.maxStayNights
                const belowMin = effectiveMin > 1 && pricing.nights < effectiveMin
                const aboveMax = effectiveMax && effectiveMax < 365 && pricing.nights > effectiveMax
                const noRate = !prop.baseNightlyRate
                const secDep = prop.securityDeposit && prop.securityDeposit > 0 ? prop.securityDeposit : null
                return (
                  <>
                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
                      {noRate ? (
                        <p className="text-amber-600 text-xs font-medium">No nightly rate set — this property cannot be booked yet.</p>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>{fmtPrice(pricing.rate, prop.currency)} × {pricing.nights} night{pricing.nights !== 1 ? 's' : ''}</span>
                            <span>{fmtPrice(pricing.subtotal, prop.currency)}</span>
                          </div>
                          {pricing.cleaning > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Cleaning fee</span><span>{fmtPrice(pricing.cleaning, prop.currency)}</span>
                            </div>
                          )}
                          {secDep && (
                            <div className="flex justify-between text-gray-500">
                              <span>Security deposit <span className="text-xs">(refundable)</span></span>
                              <span>{fmtPrice(Number(secDep), prop.currency)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                            <span>Total</span><span>{fmtPrice(pricing.total, prop.currency)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {belowMin && (
                      <p className="text-xs text-red-500 mt-2">
                        Minimum stay is {effectiveMin} nights{activeSeasonalRule ? ' during this period' : ''}. You selected {pricing.nights}.
                      </p>
                    )}
                    {aboveMax && (
                      <p className="text-xs text-red-500 mt-2">
                        Maximum stay is {effectiveMax} nights{activeSeasonalRule ? ' during this period' : ''}. You selected {pricing.nights}.
                      </p>
                    )}
                    {!prop.bookingsEnabled && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">Bookings are temporarily unavailable for this property.</p>
                    )}
                    <button
                      onClick={() => setStep('info')}
                      disabled={belowMin || !!aboveMax || noRate || !prop.bookingsEnabled}
                      className="mt-4 w-full py-3.5 text-white text-base font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={btnStyle}>
                      Continue
                    </button>
                  </>
                )
              })()}
            </div>
          )}

          {/* Step 2: guest info */}
          {step === 'info' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-lg">Your details</h2>
                <button onClick={() => setStep('dates')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                  <ChevronLeft size={13} /> Change dates
                </button>
              </div>

              {/* Booking summary */}
              <div className="rounded-2xl p-4 text-sm space-y-1.5" style={{ backgroundColor: `${primary}0d` }}>
                <div className="flex justify-between text-gray-600"><span>{fmtDate(checkIn!)} → {fmtDate(checkOut!)}</span><span>{pricing?.nights} nights</span></div>
                {promoApplied && pricing && (() => {
                  const discountAmt = promoApplied.discountType === 'PERCENT'
                    ? pricing.total * promoApplied.discountValue / 100
                    : promoApplied.discountValue
                  const discountedTotal = Math.max(0, pricing.total - discountAmt)
                  return (
                    <>
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Promo ({promoApplied.code})</span>
                        <span>-{fmtPrice(discountAmt, prop.currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{fmtPrice(discountedTotal, prop.currency)}</span></div>
                    </>
                  )
                })()}
                {!promoApplied && <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{fmtPrice(pricing?.total ?? 0, prop.currency)}</span></div>}
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Full name *', value: guestName, setter: setGuestName, type: 'text', placeholder: 'Jane Smith',           fieldKey: 'guestName' },
                  { label: 'Email *',     value: guestEmail, setter: setGuestEmail, type: 'email', placeholder: 'jane@example.com', fieldKey: 'guestEmail' },
                  { label: 'Phone',       value: guestPhone, setter: setGuestPhone, type: 'tel', placeholder: '+1 555 000 0000',     fieldKey: 'guestPhone' },
                ].map(({ label, value, setter, type, placeholder, fieldKey }) => (
                  <div key={fieldKey}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                    <input
                      value={value}
                      onChange={e => { setter(e.target.value); setFormErrors(prev => { const n = { ...prev }; delete n[fieldKey]; return n }) }}
                      type={type}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${formErrors[fieldKey] ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-gray-400'}`}
                      placeholder={placeholder}
                    />
                    {formErrors[fieldKey] && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} className="flex-shrink-0" />{formErrors[fieldKey]}
                      </p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors">
                    {[...Array(prop.maxGuests || 10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Promo code — only shown when the host has active promo codes */}
              {prop.hasActivePromos && <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Promo code</p>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoApplied(null); setPromoError(null) }}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    placeholder="Enter code"
                    disabled={!!promoApplied}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm flex-1 uppercase tracking-widest focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {promoApplied ? (
                    <button onClick={() => { setPromoApplied(null); setPromoInput(''); setPromoError(null) }}
                      className="px-3 rounded-xl border-2 border-gray-200 text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-all">✕</button>
                  ) : (
                    <button onClick={applyPromo} disabled={!promoInput.trim() || promoLoading}
                      className="px-4 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ borderColor: primary, color: primary }}>
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>
                {promoApplied && <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ {promoApplied.message}</p>}
                {promoApplied?.minNights && promoApplied.minNights > 1 && (
                  <p className="text-xs text-amber-600 mt-0.5">Requires a minimum stay of {promoApplied.minNights} nights</p>
                )}
                {promoError  && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
              </div>}

              {/* Block booking on propvian subdomain when property has a verified custom domain */}
              {_isOnPropvianSubdomain && prop.customDomain && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Booking not available on this link</p>
                    <p className="text-sm text-blue-800 leading-snug mb-2">
                      This property has a dedicated website. Please book through the official address:
                    </p>
                    <a
                      href={`https://${prop.customDomain}`}
                      className="text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 break-all">
                      {prop.customDomain}
                    </a>
                  </div>
                </div>
              )}

              {/* Payment method selector */}
              {!(_isOnPropvianSubdomain && prop.customDomain) && (!prop.bookingsEnabled ? (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-snug">
                    Bookings are temporarily unavailable. Please contact the host directly to arrange your stay.
                  </p>
                </div>
              ) : (prop.stripeEnabled || prop.paypalEnabled) ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Payment method</p>
                  <div className="flex gap-2">
                    {prop.stripeEnabled && (
                      <button onClick={() => setPayProvider('stripe')}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                        style={payProvider === 'stripe' ? { borderColor: primary, backgroundColor: `${primary}0d`, color: primary } : { borderColor: '#e5e7eb', color: '#4b5563' }}>
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
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-snug">
                    Online booking is not available yet. Please contact the host directly to arrange your stay.
                  </p>
                </div>
              ))}

              {!(_isOnPropvianSubdomain && prop.customDomain) && prop.bookingsEnabled && (prop.stripeEnabled || prop.paypalEnabled) && (
                <button
                  onClick={() => { if (validateForm()) initMut.mutate() }}
                  disabled={initMut.isPending}
                  className="w-full py-3.5 text-white text-base font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={btnStyle}>
                  {initMut.isPending && <Loader2 size={18} className="animate-spin" />}
                  {initMut.isPending ? 'Starting checkout…' : 'Continue to payment'}
                </button>
              )}
            </div>
          )}

          {/* Step 3: payment */}
          {step === 'payment' && initiated && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-lg">Payment</h2>
                <button onClick={() => { setStep('info'); setInitiated(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                  <X size={13} /> Back
                </button>
              </div>

              <div className="rounded-2xl p-4 text-sm space-y-1.5" style={{ backgroundColor: `${primary}0d` }}>
                <div className="flex justify-between text-gray-600"><span>{prop.name}</span><span>{pricing?.nights} nights</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>{fmtPrice(pricing?.total ?? 0, prop.currency)}</span></div>
              </div>

              {payProvider === 'stripe' && initiated.stripeClientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret: initiated.stripeClientSecret }}>
                  <StripePaymentForm
                    clientSecret={initiated.stripeClientSecret}
                    bookingId={initiated.bookingId}
                    onSuccess={() => setStep('done')}
                  />
                </Elements>
              )}

              {payProvider === 'paypal' && prop.paypalClientId && (
                <PayPalScriptProvider options={{ clientId: prop.paypalClientId, currency: prop.currency ?? 'USD' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                    createOrder={() => Promise.resolve(initiated.paypalOrderId!)}
                    onApprove={async (data) => {
                      try { await capturePaypal(initiated.bookingId, data.orderID); setStep('done') }
                      catch (e: any) { toast.error(e.response?.data?.message || 'Payment capture failed') }
                    }}
                    onError={() => toast.error('PayPal error. Please try again.')}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Branded footer ───────────────────────────────────────────────────── */}
      <footer className="mt-16 py-8 px-4 bg-gray-900 text-white text-center" style={{ fontFamily: font }}>
        <p className="font-bold text-sm" style={{ color: accent }}>{brandName}</p>
        <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  )
}
