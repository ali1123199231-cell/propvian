import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { onboardingApi } from '@/api/onboarding'
import { PropvianLogo } from '@/components/PropvianLogo'
import { useAuthStore } from '@/store/authStore'

export function DirectBookingOnboardingPage() {
  const navigate             = useNavigate()
  const { user, updateUser } = useAuthStore()

  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Already verified — skip straight to dashboard
  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/dashboard', { replace: true })
    }
  }, [])

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
      try { await onboardingApi.complete() } catch { /* non-blocking */ }
      updateUser({ onboardingCompleted: true, onboardingStep: 'COMPLETED' })
      navigate('/dashboard')
      toast.success('Email verified! Add your first property from the dashboard.')
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <PropvianLogo size={32} textClassName="font-bold text-gray-900" />
          <span className="text-sm text-gray-400">Almost there</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
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
              {loading ? 'Verifying…' : 'Verify & go to dashboard'}
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

        <p className="text-center text-xs text-gray-400 mt-6">
          You can add your properties, connect Stripe or PayPal, and set up your booking site from your dashboard.
        </p>
      </div>
    </div>
  )
}
