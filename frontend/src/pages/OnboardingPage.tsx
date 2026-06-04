import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, Mail, Check, ChevronRight, Loader2, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { onboardingApi } from '@/api/onboarding'
import { locksApi } from '@/api/locks'
import { useAuthStore } from '@/store/authStore'

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'EMAIL_VERIFICATION', label: 'Verify email', icon: Mail },
  { id: 'TTLOCK_CONNECT',     label: 'Connect lock', icon: Lock },
]

function stepIndex(step: string) {
  return STEPS.findIndex((s) => s.id === step)
}

function StepBar({ current }: { current: string }) {
  const idx = stepIndex(current)
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = i < idx
        const active = i === idx
        const Icon   = s.icon
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                done   ? 'bg-primary-600 text-white' :
                active ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary-600' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${i < idx ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Email Verification ───────────────────────────────────────────────

function EmailVerificationStep({ onDone }: { onDone: () => void }) {
  const { user, setAuth } = useAuthStore()
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
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
        We sent a 6-digit code to <strong className="text-gray-700">{user?.email}</strong>.
        Enter it below to verify your account.
      </p>
      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text" inputMode="numeric" maxLength={6}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="input-base text-center text-3xl tracking-widest font-bold py-4"
          placeholder="000000" autoFocus
        />
        <button type="submit" disabled={loading || code.length !== 6}
          className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-500">
        Didn't receive it?{' '}
        {countdown > 0 ? (
          <span className="text-gray-400">Resend in {countdown}s</span>
        ) : (
          <button onClick={handleResend} disabled={resending}
            className="text-primary-600 hover:text-primary-700 font-medium">
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </div>
  )
}

// ─── Step 2: TTLock Connect ───────────────────────────────────────────────────

function TTLockCredentialDialog({
  onSuccess,
  onCancel,
}: {
  onSuccess: (state: string) => void
  onCancel: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    try {
      const { state } = await locksApi.loginWithCredentials(username.trim(), password)
      onSuccess(state)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid TTLock credentials')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5">
          <Lock size={24} className="text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Sign in to TTLock</h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your TTLock app credentials to connect your lock.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">TTLock username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="input-base" placeholder="Your TTLock username"
              autoComplete="username" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">TTLock password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-base" placeholder="Your TTLock password"
              autoComplete="current-password" disabled={loading} />
          </div>
          <button type="submit" disabled={loading || !username.trim() || !password.trim()}
            className="btn-primary w-full justify-center py-3 mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? 'Connecting…' : 'Connect lock'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}
            className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1">
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

function TTLockConnectStep({ onDone, onSkip }: {
  onDone: () => void
  onSkip: () => void
}) {
  const [oauthState, setOauthState]         = useState<string | null>(null)
  const [availableLocks, setAvailableLocks] = useState<any[]>([])
  const [selected, setSelected]             = useState<any | null>(null)
  const [customName, setCustomName]         = useState('')
  const [loading, setLoading]               = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [showCredDialog, setShowCredDialog] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await locksApi.startOAuth()
      if (result.authMethod === 'password') {
        setLoading(false)
        setShowCredDialog(true)
        return
      }
      const { oauthUrl, state } = result
      setOauthState(state!)
      const popup = window.open(oauthUrl!, 'ttlock-oauth', 'width=620,height=700,left=300,top=100')
      popupRef.current = popup
      const checkPopup = setInterval(() => {
        if (popup?.closed) { clearInterval(checkPopup); setLoading(false) }
      }, 500)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start TTLock connection')
      setLoading(false)
    }
  }

  const handleCredSuccess = async (state: string) => {
    setShowCredDialog(false)
    setOauthState(state)
    await loadLocks(state)
  }

  const handleMessage = useCallback(async (e: MessageEvent) => {
    if (e.data?.type === 'ttlock-oauth-success' || e.data?.type === 'ttlock-oauth-error') {
      const state = e.data.state || oauthState
      if (e.data?.type === 'ttlock-oauth-error') {
        toast.error('TTLock authorization failed')
        setLoading(false)
        return
      }
      if (state) { setOauthState(state); await loadLocks(state) }
    }
  }, [oauthState])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stateParam = params.get('ttlock_state')
    const errorParam = params.get('ttlock_error')
    if (stateParam) {
      setOauthState(stateParam)
      loadLocks(stateParam)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (errorParam) {
      toast.error('TTLock authorization failed: ' + errorParam.replace(/_/g, ' '))
      setLoading(false)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadLocks = async (state: string) => {
    setLoading(true)
    try {
      const locks = await locksApi.getOAuthLocks(state)
      setAvailableLocks(locks)
    } catch {
      toast.error('Could not load your locks from TTLock')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selected || !oauthState) return
    setSaving(true)
    try {
      const lockName = customName.trim() || selected.lockAlias || `Lock ${selected.lockId}`
      await onboardingApi.selectLock(oauthState, selected.lockId, lockName)
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save lock selection')
    } finally {
      setSaving(false)
    }
  }

  if (availableLocks.length > 0) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select your lock</h2>
        <p className="text-gray-500 mb-6">
          Choose which lock to import. You can assign it to a property from your dashboard.
        </p>
        <div className="space-y-2 mb-5">
          {availableLocks.map((lock) => (
            <button key={lock.lockId}
              onClick={() => { setSelected(lock); setCustomName(lock.lockAlias || '') }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selected?.lockId === lock.lockId
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Lock size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{lock.lockAlias || `Lock ${lock.lockId}`}</p>
                  <p className="text-xs text-gray-500">ID: {lock.lockId}</p>
                </div>
                {selected?.lockId === lock.lockId && (
                  <Check size={18} className="text-primary-600 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
        {selected && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lock name <span className="text-gray-400 font-normal">(you can rename it)</span>
            </label>
            <input type="text" value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="input-base" placeholder={selected.lockAlias || 'e.g. Front Door'} />
          </div>
        )}
        <button onClick={handleConfirm} disabled={!selected || saving}
          className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
          {saving ? 'Saving…' : 'Continue to dashboard'}
        </button>
      </div>
    )
  }

  return (
    <>
      {showCredDialog && (
        <TTLockCredentialDialog
          onSuccess={handleCredSuccess}
          onCancel={() => { setShowCredDialog(false); setLoading(false) }}
        />
      )}
      <div className="max-w-md mx-auto">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
          <Lock size={28} className="text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your TTLock</h2>
        <p className="text-gray-500 mb-8">
          Sign in to your TTLock account to authorize access. This allows Propvian to
          create and revoke guest codes automatically.
        </p>
        <button onClick={handleConnect} disabled={loading}
          className="btn-primary w-full justify-center py-3 mb-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
          {loading ? 'Connecting…' : 'Connect with TTLock'}
        </button>
        <button onClick={onSkip}
          className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-2">
          Skip — I'll connect my lock later
        </button>
      </div>
    </>
  )
}

// ─── Onboarding Page ──────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate             = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep]      = useState(user?.onboardingStep || 'EMAIL_VERIFICATION')
  const [loadingState, setLoadingState] = useState(true)

  useEffect(() => {
    onboardingApi.getState()
      .then((state) => { setStep(state.step) })
      .catch(() => {})
      .finally(() => setLoadingState(false))
  }, [])

  const handleEmailVerified = () => {
    setStep('TTLOCK_CONNECT')
    updateUser({ emailVerified: true, onboardingStep: 'TTLOCK_CONNECT' })
  }

  const finish = async () => {
    try { await onboardingApi.complete() } catch { /* non-blocking */ }
    updateUser({ onboardingCompleted: true, onboardingStep: 'COMPLETED' })
    navigate('/dashboard')
    toast.success('Setup complete! Add your first property from the dashboard.')
  }

  if (loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Lock size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Propvian</span>
          </div>
          <span className="text-sm text-gray-400">Setting up your account</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <StepBar current={step} />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {step === 'EMAIL_VERIFICATION' && (
            <EmailVerificationStep onDone={handleEmailVerified} />
          )}
          {(step === 'TTLOCK_CONNECT' || step === 'PROPERTY_SETUP' || step === 'CALENDAR_SETUP') && (
            <TTLockConnectStep onDone={finish} onSkip={finish} />
          )}
        </div>
      </div>
    </div>
  )
}
