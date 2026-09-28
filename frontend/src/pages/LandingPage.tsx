import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
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
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { BusinessModel } from '@/types'

// ─── Schemas ─────────────────────────────────────────────────────────────────
//
// Built inside the components from `t` rather than at module scope, so that
// switching language re-renders the messages instead of leaving the visitor
// with validation errors in the language the page first loaded in.

type TFn = (key: string) => string

const buildSignInSchema = (t: TFn) =>
  z.object({
    email: z.string().email(t('landing.validation.emailInvalid')),
    password: z.string().min(1, t('landing.validation.passwordRequired')),
  })

const buildSignUpSchema = (t: TFn) =>
  z.object({
    firstName: z.string().min(1, t('landing.validation.required')).max(100),
    lastName: z.string().min(1, t('landing.validation.required')).max(100),
    email: z.string().email(t('landing.validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('landing.validation.min8'))
      .regex(/[A-Z]/, t('landing.validation.uppercase'))
      .regex(/[0-9]/, t('landing.validation.number')),
  })

type SignInData   = z.infer<ReturnType<typeof buildSignInSchema>>
type SignUpDirect = z.infer<ReturnType<typeof buildSignUpSchema>>

// ─── Password strength ───────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation('marketing')
  if (!password) return null
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const color = score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
  const label = score <= 1
    ? t('landing.password.weak')
    : score <= 3 ? t('landing.password.fair') : t('landing.password.strong')
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-500">{label} {t('landing.password.suffix')}</p>
    </div>
  )
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

function SignInForm({ businessModel }: { businessModel: BusinessModel }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation('marketing')
  const { t: tAuth } = useTranslation('auth')
  const { setAuth, setActiveOrg } = useAuthStore()
  const { fetchConfig } = useSystemStore()

  const schema = useMemo(() => buildSignInSchema(t as TFn), [t])
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInData>({
    resolver: zodResolver(schema),
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
      toast.success(t('landing.toast.welcomeBack'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('landing.toast.signInFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('login.email')}</label>
        <input {...register('email')} type="email" autoComplete="email"
          placeholder={tAuth('register.placeholders.email')} className="input-base" />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('login.password')}</label>
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
          {tAuth('login.forgotPassword')}
        </Link>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? tAuth('login.submitting') : tAuth('login.submit')}
      </button>
    </form>
  )
}

// ─── Sign Up Form — Direct Booking ────────────────────────────────────────────

function SignUpFormDirect() {
  const [showPassword, setShowPassword] = useState(false)
  const [pwValue, setPwValue]           = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation('marketing')
  const { t: tAuth } = useTranslation('auth')
  const { setAuth, setActiveOrg } = useAuthStore()
  const { fetchConfig } = useSystemStore()

  const schema = useMemo(() => buildSignUpSchema(t as TFn), [t])
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpDirect>({
    resolver: zodResolver(schema),
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

      window.gtag?.('event', 'conversion', { send_to: 'AW-18015500784/SVoYCIqh57McEPDzuo5D' })
      navigate('/onboarding-direct')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('landing.toast.registrationFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('register.firstName')}</label>
          <input {...register('firstName')} type="text" autoComplete="given-name"
            placeholder={tAuth('register.placeholders.firstName')} className="input-base" />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('register.lastName')}</label>
          <input {...register('lastName')} type="text" autoComplete="family-name"
            placeholder={tAuth('register.placeholders.lastName')} className="input-base" />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('register.email')}</label>
        <input {...register('email')} type="email" autoComplete="email"
          placeholder={tAuth('register.placeholders.email')} className="input-base" />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tAuth('register.password')}</label>
        <div className="relative">
          <input {...register('password')} type={showPassword ? 'text' : 'password'}
            autoComplete="new-password" placeholder={tAuth('register.placeholders.password')}
            className="input-base pr-10"
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
        {isSubmitting ? tAuth('register.submitting') : t('cta.startFree')}
      </button>
      <p className="text-xs text-gray-400 text-center">
        {t('landing.terms.prefix')}{' '}
        <Link to="/legal/terms" className="underline hover:text-gray-600">{t('landing.terms.terms')}</Link>{' '}
        {t('landing.terms.and')}{' '}
        <Link to="/legal/privacy" className="underline hover:text-gray-600">{t('landing.terms.privacy')}</Link>.
      </p>
    </form>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  const [tab, setTab]                       = useState<'signin' | 'signup'>('signin')
  const [businessModel, setBusinessModel]   = useState<BusinessModel>('ttlock')
  const { t }                               = useTranslation('marketing')
  const { isAuthenticated }                 = useAuthStore()

  useEffect(() => {
    systemConfigApi.getBusinessModel()
      .then(bm => setBusinessModel(bm as BusinessModel))
      .catch(() => {})
  }, [])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  // Copy differs per business model; the namespace mirrors that shape.
  const copy = {
    seoTitle: t(`landing.${businessModel}.seoTitle`),
    seoDesc:  t(`landing.${businessModel}.seoDesc`),
    headline: t(`landing.${businessModel}.headline`),
    sub:      t(`landing.${businessModel}.sub`),
    bullets:  t(`landing.${businessModel}.bullets`, { returnObjects: true }) as string[],
    footer:   t(`landing.${businessModel}.footer`),
  }

  return (
    <>
      <SEOHead title={copy.seoTitle} description={copy.seoDesc} canonical="/" />
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">

        {/* ── Left: Marketing ──────────────────────────────────── */}
        <div className="lg:flex-1 bg-gradient-to-br from-primary-900 via-primary-700 to-indigo-600 flex flex-col justify-between p-8 lg:p-14">

          {/* Logo + language — marketing pages are indexed per language, so the
              switcher changes the URL rather than only the rendered strings. */}
          <div className="flex items-center justify-between gap-4">
            <PropvianLogo size={40} textClassName="text-xl font-bold text-white tracking-tight" />
            <LanguageSwitcher variant="compact" syncUrl className="[&>button]:text-white [&>button]:hover:bg-white/10" />
          </div>

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
              {(['signin', 'signup'] as const).map(tabKey => (
                <button key={tabKey} onClick={() => setTab(tabKey)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {tabKey === 'signin' ? t('landing.tabs.signin') : t('landing.tabs.signup')}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {tab === 'signin' ? t('landing.headings.welcomeBack') : t('landing.headings.getStarted')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {tab === 'signin'
                  ? t('landing.headings.signinSub')
                  : businessModel === 'direct_booking'
                  ? t('landing.headings.signupSubDirect')
                  : t('landing.headings.signupSubTtlock')}
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
