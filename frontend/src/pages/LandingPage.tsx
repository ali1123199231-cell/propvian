import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { organizationsApi } from '@/api/organizations'
import { useAuthStore } from '@/store/authStore'
import { SEOHead } from '@/components/seo/SEOHead'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const signUpSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
})

type SignInData = z.infer<typeof signInSchema>
type SignUpData = z.infer<typeof signUpSchema>

// ─── Password strength ───────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { setAuth, setActiveOrg } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInData) => {
    try {
      const response = await authApi.login(data.email, data.password)
      setAuth(response.user, response.accessToken, response.refreshToken)

      if (!response.user.onboardingCompleted) {
        navigate('/onboarding')
        return
      }

      if (response.user.organizationId) {
        try {
          const orgs = await organizationsApi.getMy()
          if (orgs.length > 0) setActiveOrg(orgs[0])
        } catch {}
      }

      navigate('/dashboard')
      toast.success(`Welcome back!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sign in failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="input-base"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="input-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [pwValue, setPwValue] = useState('')
  const navigate = useNavigate()
  const { setAuth, setActiveOrg, updateUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  })

  const strength = passwordStrength(pwValue)

  const onSubmit = async (data: SignUpData) => {
    try {
      const response = await authApi.register(data.email, data.password, data.name)
      setAuth(response.user, response.accessToken, response.refreshToken)

      if (response.user.organizationId) {
        try {
          const orgs = await organizationsApi.getMy()
          if (orgs.length > 0) setActiveOrg(orgs[0])
        } catch {}
      }

      navigate('/onboarding')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          {...register('name')}
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className="input-base"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="input-base"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min 8 characters"
            className="input-base pr-10"
            onChange={(e) => setPwValue(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {pwValue.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strength.score ? strength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{strength.label} password</p>
          </div>
        )}
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {isSubmitting ? 'Creating account…' : 'Create free account'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        By creating an account you agree to our{' '}
        <Link to="/legal/terms" className="underline hover:text-gray-600">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/legal/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
      </p>
    </form>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  return (
    <>
    <SEOHead
      title="Smart Lock Automation for Short-Term Rentals"
      description="Automatically create and revoke TTLock guest codes from Airbnb and Booking.com reservations. Free 30-day trial. No credit card required."
      canonical="/"
    />
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Left: Marketing ─────────────────────────────────── */}
      <div className="lg:flex-1 bg-gradient-to-br from-primary-900 via-primary-700 to-indigo-600 flex flex-col justify-between p-8 lg:p-14">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <Lock size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Propvian</span>
        </div>

        {/* Hero copy */}
        <div className="py-10 lg:py-0">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Smart lock automation<br className="hidden sm:block" /> for short-term rentals
          </h1>

          <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-10 max-w-md">
            Automatically create and revoke TTLock guest codes from Airbnb and Booking.com
            reservations — and <strong className="text-white">save hours of manual work</strong>.
          </p>

          {/* Value props */}
          <div className="space-y-3 mb-10">
            {[
              'Setup takes about 5 minutes',
              'Free for 1 month. No payment details required.',
              'After trial: $2 per lock / month',
            ].map((item, i) => (
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

        {/* Footer */}
        <p className="text-primary-300 text-xs">
          © 2025 Propvian. Enterprise-grade access automation.
        </p>
      </div>

      {/* ── Right: Auth form ────────────────────────────────── */}
      <div className="lg:w-[480px] xl:w-[520px] flex items-center justify-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
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
                : 'Create an account. No credit card needed.'}
            </p>
          </div>

          {tab === 'signin' ? <SignInForm /> : <SignUpForm />}
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
        }}
      />
    </div>
    </>
  )
}
