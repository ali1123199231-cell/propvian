import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { PropvianLogo } from '@/components/PropvianLogo'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { organizationsApi } from '@/api/organizations'
import { systemConfigApi } from '@/api/systemConfig'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { SEOHead } from '@/components/seo/SEOHead'
import type { BusinessModel } from '@/types'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const signUpSchemaDirect = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName:  z.string().min(1, 'Required').max(100),
  email:     z.string().email('Invalid email'),
  password:  z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
})

type SignInData    = z.infer<typeof signInSchema>
type SignUpDirect  = z.infer<typeof signUpSchemaDirect>

// ─── Password strength ───────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const color = score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong'
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-500">{label} password</p>
    </div>
  )
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

function SignInForm({ businessModel }: { businessModel: BusinessModel }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { setAuth, setActiveOrg } = useAuthStore()
  const { fetchConfig } = useSystemStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInData) => {
    try {
      const response = await authApi.login(data.email, data.password)
      setAuth(response.user, response.accessToken, response.refreshToken)
      await fetchConfig()

      if (!response.user.onboardingCompleted) {
        navigate(businessModel === 'direct_booking' ? '/onboarding-direct' : '/onboarding')
        return
      }

      if (response.user.organizationId) {
        try {
          const orgs = await organizationsApi.getMy()
          if (orgs.length > 0) setActiveOrg(orgs[0])
        } catch {}
      }

      navigate('/dashboard')
      toast.success('Welcome back!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sign in failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input {...register('email')} type="email" autoComplete="email"
          placeholder="you@example.com" className="input-base" />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <input {...register('password')} type={showPassword ? 'text' : 'password'}
            autoComplete="current-password" placeholder="••••••••" className="input-base pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div className="flex justify-end -mt-1">
        <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Forgot password?
        </Link>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

// ─── Sign Up Form — Direct Booking ────────────────────────────────────────────

function SignUpFormDirect() {
  const [showPassword, setShowPassword] = useState(false)
  const [pwValue, setPwValue]           = useState('')
  const navigate = useNavigate()
  const { setAuth, setActiveOrg } = useAuthStore()
  const { fetchConfig } = useSystemStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpDirect>({
    resolver: zodResolver(signUpSchemaDirect),
  })

  const onSubmit = async (data: SignUpDirect) => {
    try {
      const response = await authApi.register(data.email, data.password, data.firstName, data.lastName)
      setAuth(response.user, response.accessToken, response.refreshToken)
      await fetchConfig()

      if (response.user.organizationId) {
        try {
          const orgs = await organizationsApi.getMy()
          if (orgs.length > 0) setActiveOrg(orgs[0])
        } catch {}
      }

      navigate('/onboarding-direct')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
          <input {...register('firstName')} type="text" autoComplete="given-name"
            placeholder="Jane" className="input-base" />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
          <input {...register('lastName')} type="text" autoComplete="family-name"
            placeholder="Smith" className="input-base" />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input {...register('email')} type="email" autoComplete="email"
          placeholder="you@example.com" className="input-base" />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <input {...register('password')} type={showPassword ? 'text' : 'password'}
            autoComplete="new-password" placeholder="Min 8 characters" className="input-base pr-10"
            onChange={e => setPwValue(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrengthBar password={pwValue} />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? 'Creating account…' : 'Start free'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        By signing up you agree to our{' '}
        <Link to="/legal/terms" className="underline hover:text-gray-600">Terms</Link> and{' '}
        <Link to="/legal/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
      </p>
    </form>
  )
}

// ─── Marketing copy per business model ────────────────────────────────────────

const COPY: Record<BusinessModel, {
  seoTitle: string; seoDesc: string
  headline: string; sub: string
  bullets: string[]; footer: string
}> = {
  direct_booking: {
    seoTitle:  'Propvian — Direct Booking Software for Short-Term Rental Hosts',
    seoDesc:   'Launch your own direct booking website in minutes. $10/month per property. No OTA commissions. Keep 100% of your revenue.',
    headline:  'Your own direct booking website.\nZero OTA commissions.',
    sub:       'Launch a branded booking site for your rental property. Guests book directly with you — you keep every dollar.',
    bullets:   [
      'Live booking website in under 5 minutes',
      '$10 / month per property — flat fee, no surprises',
      'Stripe & PayPal direct to your account',
    ],
    footer:    '© 2025 Propvian. Direct booking software for short-term rental hosts.',
  },
  ttlock: {
    seoTitle:  'Propvian — Smart Lock Automation for Short-Term Rentals',
    seoDesc:   'Automatically create and revoke TTLock guest codes from Airbnb and Booking.com reservations.',
    headline:  'Smart lock automation\nfor short-term rentals',
    sub:       'Automatically create and revoke TTLock guest codes from Airbnb and Booking.com reservations — and save hours of manual work.',
    bullets:   [
      'Setup takes about 5 minutes',
      'Free for 1 month — no payment details required',
      'After trial: $2 per lock / month',
    ],
    footer:    '© 2025 Propvian. Enterprise-grade access automation.',
  },
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  const [tab, setTab]                       = useState<'signin' | 'signup'>('signin')
  const [businessModel, setBusinessModel]   = useState<BusinessModel>('ttlock')
  const { fetchConfig }                     = useSystemStore()
  const { isAuthenticated }                 = useAuthStore()

  useEffect(() => {
    systemConfigApi.getBusinessModel()
      .then(bm => setBusinessModel(bm as BusinessModel))
      .catch(() => {})
  }, [])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const copy = COPY[businessModel]

  return (
    <>
      <SEOHead title={copy.seoTitle} description={copy.seoDesc} canonical="/" />
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">

        {/* ── Left: Marketing ──────────────────────────────────── */}
        <div className="lg:flex-1 bg-gradient-to-br from-primary-900 via-primary-700 to-indigo-600 flex flex-col justify-between p-8 lg:p-14">

          {/* Logo */}
          <PropvianLogo size={40} textClassName="text-xl font-bold text-white tracking-tight" />

          {/* Hero */}
          <div className="py-10 lg:py-0">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6 whitespace-pre-line">
              {copy.headline}
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-10 max-w-md">
              {copy.sub}
            </p>
            <div className="space-y-3 mb-10">
              {copy.bullets.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className={`text-primary-100 ${i === 0 ? 'font-semibold text-white' : ''}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-primary-300 text-xs">{copy.footer}</p>
        </div>

        {/* ── Right: Auth form ─────────────────────────────────── */}
        <div className="lg:w-[480px] xl:w-[520px] flex items-center justify-center p-8 lg:p-12 bg-white">
          <div className="w-full max-w-sm">

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8">
              {(['signin', 'signup'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {tab === 'signin' ? 'Welcome back' : 'Get started free'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {tab === 'signin'
                  ? 'Sign in to your Propvian account.'
                  : businessModel === 'direct_booking'
                  ? 'Create your host account in seconds.'
                  : 'Create an account. No credit card needed.'}
              </p>
            </div>

            {tab === 'signin'
              ? <SignInForm businessModel={businessModel} />
              : <SignUpFormDirect />}
          </div>
        </div>

        <Toaster position="top-right" toastOptions={{
          style: { background:'#ffffff', color:'#111827', border:'1px solid #e5e7eb', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)' },
        }} />
      </div>
    </>
  )
}
