import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Check, ChevronRight, Globe, Home, Loader2,
  Mail, MapPin, Users, FileText, Image, Star, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { propertiesApi } from '@/api/properties'
import { authApi } from '@/api/auth'
import { onboardingApi } from '@/api/onboarding'
import { useAuthStore } from '@/store/authStore'
import { COUNTRIES } from '@/constants/countries'

// ── Step bar ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Verify email' },
  { id: 2, label: 'Add property' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done   = s.id < current
        const active = s.id === current
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                done   ? 'bg-primary-600 text-white' :
                active ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={16} /> : <span className="text-sm font-semibold">{s.id}</span>}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                active ? 'text-primary-600' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                s.id < current ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Email Verification ────────────────────────────────────────────────

function EmailVerificationStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuthStore()
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return toast.error('Enter the 6-digit code')
    setLoading(true)
    try {
      const res = await authApi.verifyEmail(code)
      useAuthStore.getState().setAuth(res.user, res.accessToken, res.refreshToken)
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success('New code sent!')
      setCountdown(60)
      setCode('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
        <Mail size={28} className="text-primary-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
      <p className="text-gray-500 mb-8">
        We sent a 6-digit code to{' '}
        <strong className="text-gray-700">{user?.email}</strong>.
        Enter it below to verify your account.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text" inputMode="numeric" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          className="input-base text-center text-3xl tracking-widest font-bold py-4"
          placeholder="000000" autoFocus
        />
        <button type="submit" disabled={loading || code.length !== 6}
          className="btn-primary w-full justify-center py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-500">
        Didn't receive it?{' '}
        {countdown > 0 ? (
          <span className="text-gray-400">Resend in {countdown}s</span>
        ) : (
          <button onClick={handleResend} disabled={resending}
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
            {resending && <RefreshCw size={12} className="animate-spin" />}
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </div>
  )
}

// ── Step 2: Property Setup ────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  'Entire home', 'Private room', 'Hotel room', 'Shared room',
  'Villa', 'Apartment', 'Cabin', 'Cottage', 'Chalet', 'Boat', 'Other',
]

const AMENITIES = [
  { category: 'Essentials',    items: ['WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating'] },
  { category: 'Bedroom & Bath',items: ['Hair dryer', 'Iron', 'Dedicated workspace', 'TV', 'Free parking', 'EV charger'] },
  { category: 'Safety',        items: ['Smoke alarm', 'CO detector', 'Fire extinguisher', 'First aid kit'] },
  { category: 'Extras',        items: ['Pool', 'Hot tub', 'Gym', 'BBQ grill', 'Beach access', 'Ski-in/ski-out'] },
]

const propertySchema = z.object({
  name:         z.string().min(2, 'At least 2 characters').max(200),
  propertyType: z.string().min(1, 'Select a type'),
  address:      z.string().min(5, 'Enter full address').max(500),
  city:         z.string().min(1, 'Required').max(100),
  country:      z.string().min(1, 'Required').max(100),
  description:  z.string().min(20, 'At least 20 characters').max(5000),
  maxGuests:    z.number({ invalid_type_error: 'Enter a number' }).min(1).max(100),
})
type PropertyData = z.infer<typeof propertySchema>

function AddPropertyStep({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [photoUrls, setPhotoUrls]                 = useState<string[]>([''])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: { maxGuests: 2 },
  })

  const toggleAmenity = (a: string) =>
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const onSubmit = async (data: PropertyData) => {
    try {
      await propertiesApi.create(orgId, {
        name:        data.name,
        address:     data.address,
        city:        data.city,
        country:     data.country,
        description: data.description,
        maxGuests:   data.maxGuests,
      })
      await onboardingApi.complete()
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create property')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
          <Building2 size={24} className="text-primary-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add your first property</h2>
          <p className="text-gray-500 text-sm">Tell guests about your space</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Name + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Home size={14} className="text-gray-400" /> Property name
            </label>
            <input {...register('name')} type="text"
              placeholder="e.g. Seaside Villa Malibu" className="input-base" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property type</label>
            <select {...register('propertyType')} className="input-base">
              <option value="">Select type…</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.propertyType && <p className="mt-1 text-xs text-red-500">{errors.propertyType.message}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" /> Address
          </label>
          <input {...register('address')} type="text"
            placeholder="123 Ocean Drive, Suite 4" className="input-base" />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input {...register('city')} type="text" placeholder="Miami" className="input-base" />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <select {...register('country')} className="input-base pl-8 appearance-none">
                <option value="">Country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Users size={14} className="text-gray-400" /> Max guests
          </label>
          <input {...register('maxGuests', { valueAsNumber: true })}
            type="number" min={1} max={100} className="input-base w-28" />
          {errors.maxGuests && <p className="mt-1 text-xs text-red-500">{errors.maxGuests.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-gray-400" /> Property description
          </label>
          <textarea {...register('description')} rows={4}
            placeholder="Describe your property — location, atmosphere, what makes it special…"
            className="input-base resize-none" />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Image size={14} className="text-gray-400" /> Photos
            <span className="text-xs text-gray-400 font-normal">(optional — add more from your dashboard)</span>
          </label>
          <div className="space-y-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input type="url" value={url}
                  onChange={e => { const next = [...photoUrls]; next[i] = e.target.value; setPhotoUrls(next) }}
                  placeholder="https://example.com/photo.jpg" className="input-base flex-1" />
                {i === photoUrls.length - 1 && (
                  <button type="button" onClick={() => setPhotoUrls([...photoUrls, ''])}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            <Star size={14} className="text-gray-400" /> Amenities
          </label>
          {AMENITIES.map(group => (
            <div key={group.category} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.category}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(a => {
                  const selected = selectedAmenities.includes(a)
                  return (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full justify-center py-3.5 text-base">
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {isSubmitting ? 'Creating property…' : 'Create property & go to dashboard'}
        </button>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DirectBookingOnboardingPage() {
  const navigate              = useNavigate()
  const { user, updateUser }  = useAuthStore()

  // Determine starting step from user's onboarding state
  const getInitialStep = (): 1 | 2 => {
    if (!user) return 1
    if (user.emailVerified) return 2
    if (user.onboardingStep === 'EMAIL_VERIFICATION') return 1
    return 2
  }

  const [step, setStep] = useState<1 | 2>(getInitialStep)
  const orgId           = user?.organizationId ?? ''

  const handleEmailVerified = () => {
    updateUser({ emailVerified: true, onboardingStep: 'PROPERTY_SETUP' })
    setStep(2)
  }

  const handleComplete = () => {
    updateUser({ onboardingCompleted: true, onboardingStep: 'COMPLETED' })
    navigate('/dashboard')
    toast.success('Property created! Welcome to Propvian.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Propvian</span>
          </div>
          <span className="text-sm text-gray-400">
            Quick setup — {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <StepBar current={step} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {step === 1 && <EmailVerificationStep onDone={handleEmailVerified} />}
          {step === 2 && <AddPropertyStep orgId={orgId} onDone={handleComplete} />}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can add more properties, connect payment accounts, and set up your domain from your dashboard.
        </p>
      </div>
    </div>
  )
}
