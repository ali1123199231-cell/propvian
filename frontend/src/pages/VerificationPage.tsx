import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle, Clock, XCircle, Circle, ChevronRight, ChevronLeft,
  ShieldCheck, Home, Link, Calendar, CreditCard, Globe, BadgeCheck,
  Loader2, AlertTriangle, ExternalLink, Info, Upload, X, Copy,
  RefreshCw, Check, Plug, WifiOff, Wifi, ArrowRight, HelpCircle, Search, Pencil, Trash2,
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import toast from 'react-hot-toast'
import { verificationApi } from '@/api/verification'
import { fileUploadApi } from '@/api/fileUpload'
import { systemConfigApi } from '@/api/systemConfig'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import type { VerificationProgress, VerificationStatus, Property } from '@/types'

// ── Shared helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, { icon: typeof Circle; color: string; label: string }> = {
    NOT_STARTED: { icon: Circle,       color: 'text-gray-400',  label: 'Not started' },
    PENDING:     { icon: Clock,        color: 'text-amber-500', label: 'Under review' },
    APPROVED:    { icon: CheckCircle,  color: 'text-green-500', label: 'Approved' },
    REJECTED:    { icon: XCircle,      color: 'text-red-500',   label: 'Rejected' },
  }
  const { icon: Icon, color, label } = map[status]
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={13} /> {label}
    </span>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
      <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-700">{children}</div>
    </div>
  )
}

function ApprovedState({ label, note }: { label: string; note?: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
      <div>
        <p className="font-medium text-green-800">{label} verified</p>
        <p className="text-sm text-green-600">{note ?? 'This step is complete.'}</p>
      </div>
    </div>
  )
}

function PendingState({ label }: { label: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-3">
      <Clock size={20} className="text-amber-500 flex-shrink-0" />
      <div>
        <p className="font-medium text-amber-800">Under review</p>
        <p className="text-sm text-amber-600">Your {label.toLowerCase()} is being reviewed. We'll notify you by email.</p>
      </div>
    </div>
  )
}

function RejectedState({ label, reason }: { label: string; reason?: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <XCircle size={20} className="text-red-500 flex-shrink-0" />
        <p className="font-medium text-red-800">{label} — action required</p>
      </div>
      {reason && <p className="text-sm text-red-600 ml-8">Reason: {reason}</p>}
      <p className="text-xs text-red-500 ml-8 mt-1">Please correct and resubmit below.</p>
    </div>
  )
}

// ── File Upload component ──────────────────────────────────────────────────────

interface UploadedFile { name: string; url: string; path: string }

function FileUpload({
  label, hint, required, orgId, value, onChange,
}: {
  label: string; hint?: string; required?: boolean
  orgId: string; value?: UploadedFile; onChange: (f: UploadedFile | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = async (file: File) => {
    const MAX = 20 * 1024 * 1024
    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (file.size > MAX) { toast.error('File must be under 20 MB'); return }
    if (!ALLOWED.includes(file.type)) { toast.error('Only PDF, JPG, JPEG and PNG allowed'); return }

    setUploading(true); setProgress(10)
    try {
      // Simulate progress
      const tick = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200)
      const result = await fileUploadApi.upload(file)
      clearInterval(tick); setProgress(100)
      onChange({ name: file.name, url: result.url, path: result.path })
      setTimeout(() => setProgress(0), 600)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-800 flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => { onChange(undefined); if (inputRef.current) inputRef.current.value = '' }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 size={20} className="animate-spin text-primary-500 mx-auto" />
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500">Uploading…</p>
            </div>
          ) : (
            <>
              <Upload size={20} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Browse Files</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, JPEG, PNG · max 20 MB</p>
            </>
          )}
        </div>
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      <input
        ref={inputRef} type="file" className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── Step sidebar ──────────────────────────────────────────────────────────────

interface StepDef { key: string; label: string; icon: typeof ShieldCheck; enabledKey: keyof VerificationProgress; statusKey: keyof VerificationProgress; time: string }

const STEP_DEFS: StepDef[] = [
  { key: 'identity', label: 'Identity',           icon: ShieldCheck, enabledKey: 'identityStepEnabled', statusKey: 'identityStep',  time: '~2 min' },
  { key: 'payment',  label: 'Stripe Account',      icon: CreditCard,  enabledKey: 'paymentStepEnabled',  statusKey: 'paymentStep',   time: '~3 min' },
  { key: 'property', label: 'Property',            icon: Home,        enabledKey: 'propertyStepEnabled', statusKey: 'propertyStep',  time: '~5 min' },
  { key: 'ota',      label: 'OTA Listings',         icon: Link,        enabledKey: 'otaStepEnabled',      statusKey: 'otaStep',       time: '~2 min' },
  { key: 'calendar', label: 'Calendar Sync',        icon: Calendar,    enabledKey: 'calendarStepEnabled', statusKey: 'calendarStep',  time: '~2 min' },
  { key: 'domain',   label: 'Domain Connection',    icon: Globe,       enabledKey: 'domainStepEnabled',   statusKey: 'domainStep',    time: '~5 min' },
  { key: 'admin',    label: 'Final Review',          icon: BadgeCheck,  enabledKey: 'adminStepEnabled',    statusKey: 'adminStep',     time: '1–2 days' },
]

function StepSidebar({ progress, activeKey, onSelect }: {
  progress: VerificationProgress; activeKey: string; onSelect: (k: string) => void
}) {
  return (
    <nav className="space-y-1">
      {STEP_DEFS.map((s) => {
        const enabled = progress[s.enabledKey] as boolean
        if (!enabled) return null
        const step = progress[s.statusKey] as any
        const active = s.key === activeKey
        const Icon = s.icon
        const status: VerificationStatus = step?.status ?? 'NOT_STARTED'
        return (
          <button key={s.key} onClick={() => onSelect(s.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
              active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="relative flex-shrink-0">
              <Icon size={16} className={active ? 'text-primary-600' : 'text-gray-400'} />
              {status === 'APPROVED' && (
                <CheckCircle size={9} className="absolute -bottom-0.5 -right-0.5 text-green-500 bg-white rounded-full" />
              )}
            </div>
            <span className="flex-1">{s.label}</span>
            <span className="text-xs text-gray-400 font-normal">{s.time}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Step 1 (Stripe Connect / Payment) ─────────────────────────────────────────

function useOAuthPopup(orgId: string) {
  const qc = useQueryClient()

  const openPopup = async (
    getUrl: () => Promise<{ url: string; dev?: string }>,
    provider: 'stripe' | 'paypal'
  ) => {
    let url: string
    try {
      const result = await getUrl()
      url = result.url
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not get connect URL')
      return
    }

    const width  = 600
    const height = 700
    const left   = Math.round(window.screenX + (window.outerWidth  - width)  / 2)
    const top    = Math.round(window.screenY + (window.outerHeight - height) / 2)
    const popup  = window.open(url, `${provider}-connect`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)

    if (!popup) {
      toast.error('Popup blocked — please allow popups for this site')
      return
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'OAUTH_CALLBACK' || e.data?.provider !== provider) return
      window.removeEventListener('message', handleMessage)
      popup.close()

      if (e.data.status === 'success') {
        qc.invalidateQueries({ queryKey: ['verification', orgId] })
        toast.success(provider === 'stripe' ? 'Stripe connected!' : 'PayPal connected!')
      } else {
        toast.error(e.data.message || `${provider} connection failed`)
      }
    }

    window.addEventListener('message', handleMessage)

    // Clean up listener if popup is closed manually
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed)
        window.removeEventListener('message', handleMessage)
      }
    }, 500)
  }

  return openPopup
}

function PaymentStep({ orgId, onDone, stepData }: {
  orgId: string; onDone: () => void; stepData: any
}) {
  const status: VerificationStatus = stepData?.status ?? 'NOT_STARTED'
  const data: string[] = stepData?.data ?? []
  const stripeAccountId = data[0] || ''
  const chargesEnabled  = data[1] === 'true'
  const payoutsEnabled  = data[2] === 'true'
  const paypalAccountId = data[3] || ''

  const [loadingStripe, setLoadingStripe] = useState(false)
  const [loadingPaypal, setLoadingPaypal] = useState(false)
  const openPopup = useOAuthPopup(orgId)

  const connectStripe = async () => {
    setLoadingStripe(true)
    await openPopup(() => verificationApi.getStripeConnectUrl(orgId), 'stripe')
    setLoadingStripe(false)
  }

  const connectPaypal = async () => {
    setLoadingPaypal(true)
    await openPopup(() => verificationApi.getPaypalConnectUrl(orgId), 'paypal')
    setLoadingPaypal(false)
  }

  const stripeStatusLabel = chargesEnabled && payoutsEnabled
    ? '🟢 Payments Active'
    : stripeAccountId
      ? '🟡 Setup In Progress'
      : '⚪ Not Connected'

  if (status === 'PENDING') {
    return (
      <div className="space-y-4">
        <PendingState label="payment setup" />
        {stripeAccountId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <p><strong>Stripe {stripeAccountId}</strong> is connected but Stripe hasn't finished verifying your account yet.</p>
            <p className="mt-1.5 font-medium">{stripeStatusLabel}</p>
            <p className="mt-1.5 text-xs">Complete your Stripe onboarding to enable payouts, then reconnect below.</p>
            <button onClick={connectStripe} disabled={loadingStripe}
              className="mt-3 btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              {loadingStripe ? <Loader2 size={12} className="animate-spin" /> : null}
              Re-connect Stripe
            </button>
          </div>
        )}

        {/* PayPal is always available even while Stripe is pending */}
        <div className="border border-gray-200 hover:border-primary-300 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M20.067 8.478c.492.315.844.825.983 1.39.372 1.514-.565 3.233-2.122 3.942-.52.233-1.113.368-1.754.368H15.67a.497.497 0 0 0-.491.42l-.526 3.352-.147.927H12.93a.294.294 0 0 1-.29-.337l.949-6.024c.04-.252.257-.435.512-.435h2.34c.58 0 1.122-.097 1.61-.287.488-.189.905-.467 1.239-.822.335-.356.584-.79.727-1.294zm-7.47-.534h2.26c1.83 0 3.28.584 3.792 1.693.224.482.3 1.023.223 1.618-.33 2.518-1.864 3.74-4.537 3.74h-.94a.497.497 0 0 0-.49.42l-.527 3.35-.149.944H10.64a.295.295 0 0 1-.29-.338l1.756-11.09c.04-.252.258-.437.512-.437zm-4.24 0h2.26c.902 0 1.698.149 2.38.443-.298 2.197-1.8 3.347-4.28 3.347h-1.24a.497.497 0 0 0-.49.42l-.527 3.35h-1.59a.295.295 0 0 1-.29-.338L6.43 8.356c.04-.252.258-.412.512-.412h1.415z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">PayPal Business</p>
              <p className="text-xs text-gray-500">Connect PayPal as an alternative payment method</p>
            </div>
            {paypalAccountId && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check size={12} /> Connected
              </span>
            )}
          </div>
          {paypalAccountId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-xs text-green-700">
              Account: <strong>{paypalAccountId}</strong>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              A popup will open with PayPal's login page. Sign in and authorize Propvian to receive your account details.
            </p>
          )}
          <button onClick={connectPaypal} disabled={loadingPaypal}
            className="w-full justify-center py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium rounded-xl flex items-center gap-2 text-sm transition-colors">
            {loadingPaypal ? <Loader2 size={16} className="animate-spin" /> : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M20.067 8.478c.492.315.844.825.983 1.39.372 1.514-.565 3.233-2.122 3.942-.52.233-1.113.368-1.754.368H15.67a.497.497 0 0 0-.491.42l-.526 3.352-.147.927H12.93a.294.294 0 0 1-.29-.337l.949-6.024c.04-.252.257-.435.512-.435h2.34c.58 0 1.122-.097 1.61-.287.488-.189.905-.467 1.239-.822.335-.356.584-.79.727-1.294z"/></svg>}
            {loadingPaypal ? 'Opening PayPal…' : paypalAccountId ? 'Re-connect PayPal' : 'Connect with PayPal'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {status !== 'APPROVED' && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Stripe Account Connection</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your Stripe or PayPal account to receive direct payments. Stripe Connect also handles identity verification (KYC) so no separate ID upload is needed.
          </p>
          <InfoBox>
            <strong>How it works:</strong> Click a button below — a secure popup opens where you authorize the connection. We receive your account details automatically once you approve. Propvian never sees your passwords or banking details.
          </InfoBox>
        </>
      )}

      <div className={status !== 'APPROVED' ? 'mt-5 space-y-4' : 'space-y-4'}>
        {/* Stripe */}
        {status === 'APPROVED' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Stripe verified</p>
              <p className="text-sm text-green-600">
                {stripeAccountId
                  ? `${stripeAccountId} · ${chargesEnabled && payoutsEnabled ? 'Payments Active' : 'Setup In Progress'}`
                  : 'Payment account connected'}
              </p>
            </div>
          </div>
        ) : (
        <div className="border-2 border-gray-200 hover:border-primary-300 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stripe Connect</p>
              <p className="text-xs text-gray-500">Recommended · instant payouts · KYC included</p>
            </div>
            {stripeAccountId && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check size={12} /> Connected
              </span>
            )}
          </div>

          {stripeAccountId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-xs text-green-700">
              Account: <strong>{stripeAccountId}</strong><br />
              <span className="font-medium">{stripeStatusLabel}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              A popup will open with Stripe's secure authorization page. Approve the connection and we'll automatically link your account.
            </p>
          )}

          <button
            onClick={connectStripe}
            disabled={loadingStripe}
            className="btn-primary w-full justify-center py-2.5 bg-[#635bff] hover:bg-[#4f49d4] flex items-center gap-2"
          >
            {loadingStripe
              ? <Loader2 size={16} className="animate-spin" />
              : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
            }
            {loadingStripe ? 'Opening Stripe…' : stripeAccountId ? 'Re-connect Stripe' : 'Connect with Stripe'}
          </button>
        </div>
        )}

        {/* PayPal — always available regardless of Stripe status */}
        <div className="border border-gray-200 hover:border-primary-300 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M20.067 8.478c.492.315.844.825.983 1.39.372 1.514-.565 3.233-2.122 3.942-.52.233-1.113.368-1.754.368H15.67a.497.497 0 0 0-.491.42l-.526 3.352-.147.927H12.93a.294.294 0 0 1-.29-.337l.949-6.024c.04-.252.257-.435.512-.435h2.34c.58 0 1.122-.097 1.61-.287.488-.189.905-.467 1.239-.822.335-.356.584-.79.727-1.294zm-7.47-.534h2.26c1.83 0 3.28.584 3.792 1.693.224.482.3 1.023.223 1.618-.33 2.518-1.864 3.74-4.537 3.74h-.94a.497.497 0 0 0-.49.42l-.527 3.35-.149.944H10.64a.295.295 0 0 1-.29-.338l1.756-11.09c.04-.252.258-.437.512-.437zm-4.24 0h2.26c.902 0 1.698.149 2.38.443-.298 2.197-1.8 3.347-4.28 3.347h-1.24a.497.497 0 0 0-.49.42l-.527 3.35h-1.59a.295.295 0 0 1-.29-.338L6.43 8.356c.04-.252.258-.412.512-.412h1.415z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">PayPal Business</p>
              <p className="text-xs text-gray-500">Alternative option</p>
            </div>
            {paypalAccountId && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check size={12} /> Connected
              </span>
            )}
          </div>

          {paypalAccountId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-xs text-green-700">
              Account: <strong>{paypalAccountId}</strong>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              A popup will open with PayPal's login page. Sign in and authorize Propvian to receive your account details.
            </p>
          )}

          <button
            onClick={connectPaypal}
            disabled={loadingPaypal}
            className="w-full justify-center py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium rounded-xl flex items-center gap-2 text-sm transition-colors"
          >
            {loadingPaypal
              ? <Loader2 size={16} className="animate-spin" />
              : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M20.067 8.478c.492.315.844.825.983 1.39.372 1.514-.565 3.233-2.122 3.942-.52.233-1.113.368-1.754.368H15.67a.497.497 0 0 0-.491.42l-.526 3.352-.147.927H12.93a.294.294 0 0 1-.29-.337l.949-6.024c.04-.252.257-.435.512-.435h2.34c.58 0 1.122-.097 1.61-.287.488-.189.905-.467 1.239-.822.335-.356.584-.79.727-1.294z"/></svg>
            }
            {loadingPaypal ? 'Opening PayPal…' : paypalAccountId ? 'Re-connect PayPal' : 'Connect with PayPal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 2 (Property Verification) ────────────────────────────────────────────

function PropertyVerifStep({ orgId, onDone, status, stepData, properties }: {
  orgId: string; onDone: () => void; status: VerificationStatus; stepData: any; properties: Property[]
}) {
  const qc = useQueryClient()
  const firstProp = properties[0]
  const [selectedPropId, setSelectedPropId] = useState(firstProp?.id ?? '')
  const selectedProp = properties.find(p => p.id === selectedPropId) ?? firstProp

  const autoAddress = selectedProp
    ? [selectedProp.address, selectedProp.city, selectedProp.state, selectedProp.country].filter(Boolean).join(', ')
    : ''

  const schema = z.object({ propertyAddressLine: z.string().min(5, 'Enter full address') })
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { propertyAddressLine: autoAddress },
  })
  useEffect(() => { setValue('propertyAddressLine', autoAddress) }, [autoAddress, setValue])

  const [ownershipDoc, setOwnershipDoc]     = useState<{ name: string; url: string; path: string } | undefined>()
  const [managementDoc, setManagementDoc]   = useState<{ name: string; url: string; path: string } | undefined>()
  const [utilityBill, setUtilityBill]       = useState<{ name: string; url: string; path: string } | undefined>()

  const onSubmit = async (data: any) => {
    if (!ownershipDoc && !managementDoc) {
      toast.error('Upload either an ownership proof or rental authorization document')
      return
    }
    if (!utilityBill) { toast.error('A utility bill (last 6 months) is required'); return }
    try {
      await verificationApi.submitProperty(orgId, {
        propertyAddressLine: data.propertyAddressLine,
        ownershipProofUrl:   ownershipDoc?.url,
        managementAuthUrl:   managementDoc?.url,
        utilityBillUrl:      utilityBill?.url,
      })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Property documents submitted for review')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    }
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Home size={26} className="text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add a property first</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          You need at least one property in your account before you can submit verification documents.
        </p>
        <RouterLink to="/properties"
          className="btn-primary inline-flex items-center gap-2 justify-center px-5 py-2.5">
          Go to Properties <ArrowRight size={15} />
        </RouterLink>
      </div>
    )
  }

  if (status === 'APPROVED') return <ApprovedState label="Property" />
  if (status === 'PENDING')  return <PendingState label="property verification" />

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Property Verification</h3>
      <p className="text-sm text-gray-500 mb-4">
        Confirm you have legal rights to rent this property. Upload ownership proof or rental authorization plus a recent utility bill.
      </p>

      {status === 'REJECTED' && <div className="mb-4"><RejectedState label="Property" reason={stepData?.rejectionReason} /></div>}

      <InfoBox>
        <strong>Option A — Ownership proof:</strong> Title deed, property tax document, or mortgage statement.<br />
        <strong>Option B — Rental authorization:</strong> Lease agreement, property management agreement, or rental authorization letter.<br />
        At least one from Option A or B is required.
      </InfoBox>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-5">
        {properties.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select property to verify</label>
            <select value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)} className="input-base">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {selectedProp && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Property details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
              <span className="text-gray-500">Name</span><span>{selectedProp.name}</span>
              {selectedProp.propertyType && <><span className="text-gray-500">Type</span><span>{selectedProp.propertyType}</span></>}
              {selectedProp.bedrooms   != null && <><span className="text-gray-500">Bedrooms</span><span>{selectedProp.bedrooms}</span></>}
              {selectedProp.maxGuests  != null && <><span className="text-gray-500">Max guests</span><span>{selectedProp.maxGuests}</span></>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full property address *</label>
          <input {...register('propertyAddressLine')} className="input-base"
            placeholder="123 Ocean Drive, Miami, FL 33139, USA" />
          {errors.propertyAddressLine && <p className="mt-1 text-xs text-red-500">{String(errors.propertyAddressLine.message)}</p>}
        </div>

        <div className="space-y-4 pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Option A — Ownership proof</p>
          <FileUpload
            label="Ownership document"
            hint="Title deed, property tax document, or mortgage statement"
            orgId={orgId}
            value={ownershipDoc}
            onChange={setOwnershipDoc}
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Option B — Rental authorization</p>
          <FileUpload
            label="Rental authorization document"
            hint="Lease agreement, property management agreement, or rental authorization letter"
            orgId={orgId}
            value={managementDoc}
            onChange={setManagementDoc}
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Utility bill <span className="text-red-500">*</span></p>
          <FileUpload
            label="Utility bill (issued within last 6 months)"
            hint="Electricity, water, gas, or internet bill — must show property address"
            required
            orgId={orgId}
            value={utilityBill}
            onChange={setUtilityBill}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSubmitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}

// ── Platform config ───────────────────────────────────────────────────────────

const OTA_PLATFORMS = [
  { id: 'airbnb',  label: 'Airbnb',      bg: 'bg-[#FF5A5F]', placeholder: 'https://www.airbnb.com/rooms/12345678' },
  { id: 'booking', label: 'Booking.com', bg: 'bg-[#003580]', placeholder: 'https://www.booking.com/hotel/us/my-property.html' },
  { id: 'vrbo',    label: 'VRBO',        bg: 'bg-[#1D5FA7]', placeholder: 'https://www.vrbo.com/1234567' },
  { id: 'other',   label: 'Other',       bg: 'bg-gray-500',  placeholder: 'https://…' },
]

const ICAL_PLATFORMS = [
  { id: 'airbnb',  label: 'Airbnb',      bg: 'bg-[#FF5A5F]', placeholder: 'https://www.airbnb.com/calendar/ical/12345678.ics?s=…' },
  { id: 'booking', label: 'Booking.com', bg: 'bg-[#003580]', placeholder: 'https://ical.booking.com/v1/export?t=…' },
  { id: 'vrbo',    label: 'VRBO',        bg: 'bg-[#1D5FA7]', placeholder: 'https://www.vrbo.com/icalendar/…ics' },
  { id: 'other',   label: 'Other / PMS', bg: 'bg-gray-500',  placeholder: 'https://yourpms.com/calendar/export.ics' },
]

function PlatformBadge({ platformId, platforms }: { platformId: string; platforms: typeof OTA_PLATFORMS }) {
  const p = platforms.find(x => x.id === platformId) ?? platforms[platforms.length - 1]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white flex-shrink-0 ${p.bg}`}>
      {p.label}
    </span>
  )
}

// ── Step 3 (OTA Listings) ─────────────────────────────────────────────────────

function OtaStep({ orgId, onDone, status, stepData }: {
  orgId: string; onDone: () => void; status: VerificationStatus; stepData: any
}) {
  const qc = useQueryClient()
  const data: string[] = stepData?.data ?? []
  const verificationNote = data[2] || ''
  const reviewCount      = parseInt(data[3] || '0', 10)

  const [listings, setListings] = useState<{ platform: string; url: string }[]>([])
  const [selPlatform, setSelPlatform] = useState('airbnb')
  const [urlInput, setUrlInput]       = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const currentPlaceholder = OTA_PLATFORMS.find(p => p.id === selPlatform)?.placeholder ?? ''

  const addListing = () => {
    const url = urlInput.trim()
    if (!url) return
    try { new URL(url) } catch { toast.error('Enter a valid URL'); return }
    setListings(ls => [...ls, { platform: selPlatform, url }])
    setUrlInput('')
  }

  const removeListing = (i: number) => setListings(ls => ls.filter((_, j) => j !== i))

  const handleSubmit = async () => {
    if (listings.length === 0) { toast.error('Add at least one listing URL'); return }
    setSubmitting(true)
    try {
      const byPlatform = listings.reduce((acc, l) => {
        acc[l.platform] = acc[l.platform] ?? []
        acc[l.platform].push(l.url)
        return acc
      }, {} as Record<string, string[]>)

      await verificationApi.submitOta(orgId, {
        airbnbListingUrl:  byPlatform['airbnb']?.[0],
        bookingListingUrl: byPlatform['booking']?.[0],
        vrboListingUrl:    byPlatform['vrbo']?.[0],
        otherListingUrls:  [
          ...(byPlatform['other']   ?? []),
          ...(byPlatform['airbnb']?.slice(1)  ?? []),
          ...(byPlatform['booking']?.slice(1) ?? []),
          ...(byPlatform['vrbo']?.slice(1)    ?? []),
        ],
      })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('OTA listings submitted — checking automatically…')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  if (status === 'APPROVED') return <ApprovedState label="OTA listings" note={verificationNote || undefined} />
  if (status === 'PENDING' && verificationNote) {
    return (
      <div>
        <PendingState label="OTA listings" />
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{verificationNote}</p>
          </div>
          {reviewCount > 0 && reviewCount < 3 && (
            <p className="text-xs text-amber-600 mt-2 ml-5">
              We require at least 3 reviews. Your listing shows {reviewCount} review(s).
            </p>
          )}
        </div>
      </div>
    )
  }
  if (status === 'PENDING') return <PendingState label="OTA listings" />

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">OTA Listing Verification</h3>
      <p className="text-sm text-gray-500 mb-4">
        Add your active OTA listings. We verify you're an experienced host automatically.
      </p>

      {status === 'REJECTED' && <div className="mb-4"><RejectedState label="OTA" reason={stepData?.rejectionReason} /></div>}

      <InfoBox>
        <strong>Auto-verification:</strong> We check your listing automatically. You need at least 3 guest reviews to qualify.
      </InfoBox>

      {/* Add listing row */}
      <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <p className="text-sm font-semibold text-gray-700">Add a listing</p>
        <div className="flex gap-2">
          <select value={selPlatform} onChange={e => { setSelPlatform(e.target.value); setUrlInput('') }}
            className="input-base w-36 flex-shrink-0 text-sm">
            {OTA_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addListing())}
            placeholder={currentPlaceholder}
            className="input-base flex-1 text-sm"
          />
          <button type="button" onClick={addListing}
            className="btn-primary px-4 text-sm flex-shrink-0">
            Add
          </button>
        </div>
      </div>

      {/* Added listings */}
      {listings.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Added listings ({listings.length})</p>
          {listings.map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <PlatformBadge platformId={l.platform} platforms={OTA_PLATFORMS} />
              <span className="flex-1 text-xs text-gray-700 truncate">{l.url}</span>
              <button onClick={() => removeListing(i)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {listings.length === 0 && (
        <p className="mt-4 text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
          No listings added yet — select a platform and paste your URL above
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting || listings.length === 0}
        className="btn-primary justify-center py-2.5 w-full mt-5 disabled:opacity-40">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
        {submitting ? 'Verifying…' : 'Verify OTA listings'}
      </button>
    </div>
  )
}

// ── Step 4 (Calendar) ─────────────────────────────────────────────────────────

function CalendarStep({ orgId, onDone, status }: {
  orgId: string; onDone: () => void; status: VerificationStatus
}) {
  const qc = useQueryClient()

  const [feeds, setFeeds] = useState<{ platform: string; url: string }[]>([])
  const [selPlatform, setSelPlatform] = useState('airbnb')
  const [urlInput, setUrlInput]       = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [testResults, setTestResults] = useState<Record<number, 'testing' | 'ok' | 'fail'>>({})
  const [testMessages, setTestMessages] = useState<Record<number, string>>({})

  const currentPlaceholder = ICAL_PLATFORMS.find(p => p.id === selPlatform)?.placeholder ?? ''

  const addFeed = () => {
    const url = urlInput.trim()
    if (!url) return
    try { new URL(url) } catch { toast.error('Enter a valid URL'); return }
    setFeeds(fs => [...fs, { platform: selPlatform, url }])
    setUrlInput('')
  }

  const removeFeed = (i: number) => {
    setFeeds(fs => fs.filter((_, j) => j !== i))
    setTestResults(r => { const n = { ...r }; delete n[i]; return n })
    setTestMessages(m => { const n = { ...m }; delete n[i]; return n })
  }

  const testFeed = async (i: number, url: string) => {
    setTestResults(r => ({ ...r, [i]: 'testing' }))
    try {
      const res = await verificationApi.testIcal(url)
      setTestResults(r => ({ ...r, [i]: res.success ? 'ok' : 'fail' }))
      setTestMessages(m => ({ ...m, [i]: res.message }))
    } catch {
      setTestResults(r => ({ ...r, [i]: 'fail' }))
      setTestMessages(m => ({ ...m, [i]: 'Connection failed' }))
    }
  }

  const handleSubmit = async () => {
    if (feeds.length === 0) { toast.error('Add at least one iCal feed'); return }
    setSubmitting(true)
    try {
      const byPlatform = feeds.reduce((acc, f) => {
        acc[f.platform] = acc[f.platform] ?? []
        acc[f.platform].push(f.url)
        return acc
      }, {} as Record<string, string[]>)

      await verificationApi.connectCalendar(orgId, {
        airbnbIcalUrl:  byPlatform['airbnb']?.[0],
        bookingIcalUrl: byPlatform['booking']?.[0],
        vrboIcalUrl:    byPlatform['vrbo']?.[0],
        otherIcalUrls:  [
          ...(byPlatform['other']   ?? []),
          ...(byPlatform['airbnb']?.slice(1)  ?? []),
          ...(byPlatform['booking']?.slice(1) ?? []),
          ...(byPlatform['vrbo']?.slice(1)    ?? []),
        ],
      })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Calendars connected!')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Connection failed')
    } finally { setSubmitting(false) }
  }

  if (status === 'APPROVED') return <ApprovedState label="Calendar" note="Your calendar syncs every 15 minutes automatically." />

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Calendar Synchronization</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your iCal feeds to prevent double bookings. Calendars sync every 15 minutes.
      </p>

      <InfoBox>
        <strong>Why iCal sync?</strong> We import your existing reservations so guests can't book already-taken dates. Conflict detection happens in real time.
      </InfoBox>

      <div className="mt-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Already have calendar integrations?</p>
          <p className="text-xs text-gray-500">Connected integrations automatically satisfy this step.</p>
        </div>
        <RouterLink to="/integrations" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
          <Plug size={11} /> Integrations
        </RouterLink>
      </div>

      {/* Add feed row */}
      <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <p className="text-sm font-semibold text-gray-700">Add a calendar feed</p>
        <div className="flex gap-2">
          <select value={selPlatform} onChange={e => { setSelPlatform(e.target.value); setUrlInput('') }}
            className="input-base w-36 flex-shrink-0 text-sm">
            {ICAL_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeed())}
            placeholder={currentPlaceholder}
            className="input-base flex-1 text-sm"
          />
          <button type="button" onClick={addFeed}
            className="btn-primary px-4 text-sm flex-shrink-0">
            Add
          </button>
        </div>
      </div>

      {/* Added feeds */}
      {feeds.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Added feeds ({feeds.length})</p>
          {feeds.map((f, i) => (
            <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <PlatformBadge platformId={f.platform} platforms={ICAL_PLATFORMS} />
                <span className="flex-1 text-xs text-gray-700 truncate">{f.url}</span>
                <button type="button" onClick={() => testFeed(i, f.url)}
                  disabled={testResults[i] === 'testing'}
                  className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1 flex-shrink-0 disabled:opacity-40">
                  {testResults[i] === 'testing' ? <Loader2 size={11} className="animate-spin" /> : 'Test'}
                </button>
                <button onClick={() => removeFeed(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              {testResults[i] === 'ok' && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 ml-1">
                  <Wifi size={11} /> {testMessages[i] || 'Connection successful'}
                </div>
              )}
              {testResults[i] === 'fail' && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 ml-1">
                  <WifiOff size={11} /> {testMessages[i] || 'Connection failed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {feeds.length === 0 && (
        <p className="mt-4 text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
          No feeds added yet — select a platform and paste your iCal URL above
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting || feeds.length === 0}
        className="btn-primary justify-center py-2.5 w-full mt-5 disabled:opacity-40">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
        {submitting ? 'Connecting…' : 'Connect calendars'}
      </button>
    </div>
  )
}

// ── Domain shared helpers ─────────────────────────────────────────────────────

const CNAME_TARGET = 'booking.propvian.com'

function DomainCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="ml-1 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  )
}

function DnsHelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">How to connect your domain</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step-by-step guide — no tech skills needed</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Enter your domain below</p>
              <p className="text-xs text-gray-500 mt-1">Type the domain name you own, like <code className="bg-gray-100 px-1 rounded">myvilla.com</code> or <code className="bg-gray-100 px-1 rounded">stay.myvilla.com</code>.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Log in to your domain registrar</p>
              <p className="text-xs text-gray-500 mt-1">This is the website where you bought your domain — GoDaddy, Namecheap, Cloudflare, Google Domains, etc. Look for a <strong>DNS settings</strong> or <strong>DNS management</strong> section.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Add these 2 records</p>
              <p className="text-xs text-gray-500 mt-1 mb-3">In your registrar's DNS settings, add the CNAME record, then set up the redirect:</p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden text-xs font-mono">
                <div className="grid grid-cols-3 bg-gray-100 text-gray-500 font-sans font-semibold px-3 py-2">
                  <span>Type</span><span>Name / Host</span><span>Value / Points to</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2.5 text-gray-800 gap-2 border-b border-gray-100">
                  <span className="font-bold text-blue-600">CNAME</span>
                  <span>www</span>
                  <span className="text-green-700 break-all">{CNAME_TARGET}</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2.5 text-gray-800 gap-2">
                  <span className="font-bold text-purple-600">Redirect</span>
                  <span>@</span>
                  <span className="text-green-700 font-sans">www.yourdomain.com</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">💡 The <strong>Redirect</strong> is not a DNS record — it's a forwarding rule built into your registrar. In GoDaddy it's called <strong>Forwarding</strong>, in Namecheap it's <strong>URL Redirect</strong>. This makes <em>yourdomain.com</em> redirect to <em>www.yourdomain.com</em>.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Wait and verify</p>
              <p className="text-xs text-gray-500 mt-1">DNS changes can take anywhere from a few minutes to 48 hours. Once done, click <strong>Check DNS</strong> — we'll confirm automatically and issue your SSL certificate.</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Jump to DNS settings for popular providers</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'GoDaddy',        url: 'https://dcc.godaddy.com/manage/dns' },
                { name: 'Namecheap',      url: 'https://ap.www.namecheap.com/Domains/DomainControlPanel' },
                { name: 'Cloudflare',     url: 'https://dash.cloudflare.com' },
                { name: 'Google Domains', url: 'https://domains.google.com' },
              ].map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                  {p.name}<ExternalLink size={11} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BuyDomainModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  function handleSearch() {
    const domain = query.trim().replace(/^https?:\/\//i, '').split('/')[0]
    if (!domain) return
    window.open(`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(domain)}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Find your domain</h2>
            <p className="text-xs text-gray-400 mt-0.5">Search and buy a domain from GoDaddy</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">A custom domain like <strong>myvilla.com</strong> looks more professional and builds trust with guests.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. myvilla.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400"
                autoFocus />
            </div>
            <button onClick={handleSearch} disabled={!query.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 transition-colors">
              Search <ExternalLink size={13} />
            </button>
          </div>
          <p className="text-xs text-gray-400">Powered by GoDaddy — domains from ~$10/year</p>
        </div>
      </div>
    </div>
  )
}

// ── Step 5 (Domain) ───────────────────────────────────────────────────────────

function DomainStep({ orgId, onDone, status, stepData, orgSlug, requireCustomDomain }: {
  orgId: string; onDone: () => void; status: VerificationStatus; stepData: any; orgSlug: string; requireCustomDomain: boolean
}) {
  const qc = useQueryClient()
  const data: string[] = stepData?.data ?? []
  const savedDomain = data[0] || ''

  const schema = z.object({
    domain: z.string().min(4, 'Enter a valid domain')
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, 'Invalid domain format — no http:// or trailing slash'),
  })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const [checking, setChecking] = useState(false)
  const [dnsResult, setDnsResult] = useState<{ verified: boolean; message: string } | null>(null)
  const [showDnsHelp, setShowDnsHelp] = useState(false)
  const [showBuyDomain, setShowBuyDomain] = useState(false)
  const [editingDomain, setEditingDomain] = useState(false)

  const deleteDomainMut = useMutation({
    mutationFn: () => verificationApi.deleteDomain(orgId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['verification', orgId] }); toast.success('Domain removed') },
    onError: () => toast.error('Failed to remove domain'),
  })

  const checkDns = async () => {
    setChecking(true); setDnsResult(null)
    try {
      const res = await verificationApi.checkDomainDns(orgId)
      setDnsResult(res)
      if (res.verified) {
        qc.invalidateQueries({ queryKey: ['verification', orgId] })
        toast.success('Domain verified!')
        onDone()
      }
    } catch { toast.error('DNS check failed') }
    finally { setChecking(false) }
  }

  const onSubmit = async (formData: any) => {
    try {
      await verificationApi.connectDomain(orgId, { domain: formData.domain })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success(formData.domain.endsWith('.propvian.com') ? `Using ${formData.domain}` : 'Domain saved — add the CNAME record to activate it')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Connection failed')
    }
  }

  const subdomainUrl = `${orgSlug}.propvian.com`

  const useSubdomain = async () => {
    try {
      await verificationApi.connectDomain(orgId, { domain: subdomainUrl })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success(`Using ${subdomainUrl}`)
      onDone()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (status === 'APPROVED' && !editingDomain) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">Domain verified</p>
            <p className="text-sm text-green-600">{savedDomain || 'Your domain is live.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingDomain(true)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove the custom domain "${savedDomain}"?`)) {
                deleteDomainMut.mutate()
              }
            }}
            disabled={deleteDomainMut.isPending}
            className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Domain Connection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect a custom domain so guests book on your brand. We'll provision SSL automatically.
      </p>

      {/* ── Pending DNS verification ── */}
      {status === 'PENDING' && savedDomain && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            Pending DNS verification for <strong>{savedDomain}</strong>
          </p>
          <div className="rounded-xl border border-gray-200 overflow-hidden text-sm bg-white mb-3">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 border-b border-gray-200">
              <span>Type</span><span>Host / Name</span><span>Value / Points to</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2 border-b border-gray-100">
              <span className="font-bold text-blue-600 text-xs">CNAME</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">www</code>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">{CNAME_TARGET}</code>
                <DomainCopyButton text={CNAME_TARGET} />
              </div>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2">
              <span className="font-bold text-purple-600 text-xs">Redirect</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@</code>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">{savedDomain}</code>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-1">DNS changes take 5–30 minutes to propagate.</p>
          <p className="text-xs text-gray-400 mb-3">The <strong>Redirect</strong> is a forwarding rule at your registrar — GoDaddy calls it <strong>Forwarding</strong>, Namecheap calls it <strong>URL Redirect</strong>.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={checkDns} disabled={checking}
              className="btn-primary text-sm py-2 flex items-center gap-2">
              {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {checking ? 'Checking…' : 'Check DNS now'}
            </button>
            <button onClick={() => setShowDnsHelp(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <HelpCircle size={12} /> How do I do this?
            </button>
          </div>
          {dnsResult && !dnsResult.verified && (
            <p className="mt-2 text-xs text-red-500">{dnsResult.message}</p>
          )}
        </div>
      )}

      {/* ── Free Propvian subdomain option ── */}
      {!requireCustomDomain && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-green-800 mb-1">Quick option: Use a Propvian subdomain</p>
          <p className="text-xs text-green-600 mb-3">
            Skip DNS setup — use <strong>{subdomainUrl}</strong> instantly, no configuration needed.
          </p>
          <button onClick={useSubdomain} className="btn-primary text-sm py-2 px-4">
            Use {subdomainUrl}
          </button>
        </div>
      )}
      {requireCustomDomain && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Custom domain required</p>
            <p className="text-xs text-amber-700 mt-0.5">The platform requires a custom domain — Propvian subdomains are not accepted. Connect your own domain below.</p>
          </div>
        </div>
      )}

      {/* ── Custom domain form ── */}
      <p className="text-sm font-medium text-gray-700 mb-1">
        {requireCustomDomain ? 'Connect your domain:' : 'Or connect your own domain:'}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Use your own domain like <em>myvilla.com</em> for a more professional look.{' '}
        <button onClick={() => setShowBuyDomain(true)} className="text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
          Don't have one? Find a domain →
        </button>
      </p>

      {/* DNS record preview — only shown before a domain is saved */}
      {status !== 'PENDING' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">After saving, add this DNS record</p>
            <button onClick={() => setShowDnsHelp(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <HelpCircle size={12} /> How do I do this?
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 border-b border-gray-200">
              <span>Type</span><span>Host / Name</span><span>Value / Points to</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2 border-b border-gray-100">
              <span className="font-bold text-blue-600 text-xs">CNAME</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">www</code>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">{CNAME_TARGET}</code>
                <DomainCopyButton text={CNAME_TARGET} />
              </div>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2">
              <span className="font-bold text-purple-600 text-xs">Redirect</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@</code>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">www.yourdomain.com</code>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">DNS propagation: 5–30 minutes. SSL issued automatically once confirmed.</p>
          <p className="mt-1 text-xs text-gray-400">The <strong>Redirect</strong> is a forwarding rule at your registrar (not a DNS record) — GoDaddy calls it <strong>Forwarding</strong>, Namecheap calls it <strong>URL Redirect</strong>.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your domain</label>
          <input {...register('domain')} className="input-base" placeholder="www.myvilla.com" />
          <p className="mt-1 text-xs text-gray-400">Use <strong>www.yourdomain.com</strong> — e.g. www.beachvilla.com</p>
          {errors.domain && <p className="mt-1 text-xs text-red-500">{String(errors.domain.message)}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSubmitting ? 'Connecting…' : 'Connect domain'}
        </button>
      </form>

      {showDnsHelp   && <DnsHelpModal   onClose={() => setShowDnsHelp(false)} />}
      {showBuyDomain && <BuyDomainModal onClose={() => setShowBuyDomain(false)} />}
    </div>
  )
}

// ── Step 6 (Admin / Final Review) ─────────────────────────────────────────────

function AdminApprovalStep({ progress, autoApprove }: { progress: VerificationProgress; autoApprove: boolean }) {
  const step = progress.adminStep
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Final Review</h3>
      <p className="text-sm text-gray-500 mb-5">
        Our team reviews all hosts before enabling live bookings.
      </p>

      {autoApprove && (
        <InfoBox>
          <strong>Auto-approval enabled</strong> — your account will be approved automatically once all steps pass.
        </InfoBox>
      )}

      <div className={`rounded-xl p-5 border mt-4 ${
        step.status === 'APPROVED' ? 'bg-green-50 border-green-200' :
        step.status === 'REJECTED' ? 'bg-red-50 border-red-200'   :
        step.status === 'PENDING'  ? 'bg-amber-50 border-amber-200' :
        'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-2"><StatusBadge status={step.status} /></div>
        {step.status === 'NOT_STARTED' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Complete all required steps to trigger final review.</p>
            <div className="text-xs text-gray-500 space-y-1 mt-3">
              <p className="font-medium text-gray-600">What we review:</p>
              <p>• Property documents and utility bill match the address</p>
              <p>• OTA listings have at least 3 verified reviews</p>
              <p>• Stripe account is connected and payouts are enabled</p>
              <p>• Domain DNS is configured correctly</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">Estimated review time: 1–2 business days</p>
          </div>
        )}
        {step.status === 'PENDING' && (
          <p className="text-sm text-amber-700">Your application is under review. We'll notify you by email within 1–2 business days.</p>
        )}
        {step.status === 'APPROVED' && (
          <p className="text-sm text-green-700 font-medium">Approved! Your bookings are now live.</p>
        )}
        {step.status === 'REJECTED' && (
          <>
            <p className="text-sm text-red-700 font-medium">Application rejected.</p>
            {step.rejectionReason && <p className="text-sm text-red-600 mt-1">Reason: {step.rejectionReason}</p>}
            <p className="text-xs text-red-500 mt-2">Please correct the issues and resubmit the relevant steps.</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Identity Step (hidden by default) ─────────────────────────────────────────

function IdentityStep({ orgId, onDone, status }: { orgId: string; onDone: () => void; status: VerificationStatus }) {
  const qc = useQueryClient()
  const schema = z.object({
    identityDocumentUrl: z.string().url('Enter a valid URL'),
    selfieUrl:           z.string().url('Enter a valid URL'),
  })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const onSubmit = async (data: any) => {
    try {
      await verificationApi.submitIdentity(orgId, data)
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Identity submitted'); onDone()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Submission failed') }
  }
  if (status === 'APPROVED') return <ApprovedState label="Identity" />
  if (status === 'PENDING')  return <PendingState label="identity" />
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Government ID URL</label>
        <input {...register('identityDocumentUrl')} className="input-base" placeholder="https://…" />
        {errors.identityDocumentUrl && <p className="mt-1 text-xs text-red-500">{String(errors.identityDocumentUrl.message)}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Selfie URL</label>
        <input {...register('selfieUrl')} className="input-base" placeholder="https://…" />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} Submit
      </button>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function VerificationPage() {
  const { activeOrg } = useAuthStore()
  const orgId  = activeOrg?.id ?? ''
  const orgSlug = activeOrg?.slug ?? activeOrg?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'my-org'

  const { data: progress, isLoading } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
    refetchInterval: 30000,
  })

  const { data: sysConfig } = useQuery({
    queryKey: ['system-config'],
    queryFn:  () => systemConfigApi.getConfig(),
  })

  const { data: propertiesPage } = useQuery({
    queryKey: ['properties', orgId],
    queryFn:  () => propertiesApi.list(orgId),
    enabled:  !!orgId,
  })

  const properties = propertiesPage?.content ?? []
  const adminAutoApprove    = sysConfig?.['verification.admin_auto_approve']    === 'true'
  const requireCustomDomain = sysConfig?.['verification.domain_require_custom'] === 'true'

  const [activeKey, setActiveKey] = useState<string>('')

  useEffect(() => {
    if (!progress || activeKey) return
    const firstIncomplete = STEP_DEFS.find(s => {
      const enabled = progress[s.enabledKey] as boolean
      if (!enabled) return false
      const step = progress[s.statusKey] as any
      return step?.status !== 'APPROVED'
    })
    setActiveKey(firstIncomplete?.key ?? 'payment')
  }, [progress, activeKey])

  if (isLoading || !progress || !activeKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  const enabledSteps = STEP_DEFS.filter(s => progress[s.enabledKey] as boolean)
  const activeIdx    = enabledSteps.findIndex(s => s.key === activeKey)
  const hasNext      = activeIdx < enabledSteps.length - 1
  const hasPrev      = activeIdx > 0
  const goNext = () => { if (hasNext) setActiveKey(enabledSteps[activeIdx + 1].key) }
  const goPrev = () => { if (hasPrev) setActiveKey(enabledSteps[activeIdx - 1].key) }

  const activeStepDef  = STEP_DEFS.find(s => s.key === activeKey)
  const activeStepData = activeStepDef ? progress[activeStepDef.statusKey as keyof VerificationProgress] as any : null
  const activeStatus: VerificationStatus = activeStepData?.status ?? 'NOT_STARTED'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
        <p className="text-gray-500 mt-1">Complete all steps to enable live bookings on your property website.</p>
      </div>

      {/* Trust badge */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-800">Why verification matters</p>
          <p className="text-sm text-primary-700">
            Verified hosts build guest trust, get higher conversion rates, and access all Propvian features. Your information is stored securely and encrypted at rest.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {progress.bookingsEnabled ? 'All steps complete — bookings are live!' : progress.blockingReason ?? 'Complete all steps to enable bookings'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{progress.completedSteps} of {progress.totalRequiredSteps} steps completed</p>
          </div>
          <span className="text-2xl font-bold text-primary-600">{progress.progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress.progressPercent}%` }} />
        </div>

        {/* Step pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {enabledSteps.map(s => {
            const st = (progress[s.statusKey as keyof VerificationProgress] as any)?.status ?? 'NOT_STARTED'
            const color = st === 'APPROVED' ? 'bg-green-100 text-green-700' : st === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
            return (
              <span key={s.key} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>
                {st === 'APPROVED' ? <CheckCircle size={10} /> : st === 'PENDING' ? <Clock size={10} /> : <Circle size={10} />}
                {s.label}
              </span>
            )
          })}
        </div>

        {progress.bookingsEnabled ? (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Bookings enabled — guests can now book your property!
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle size={14} /> Booking button is disabled until all required steps are approved
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <StepSidebar progress={progress} activeKey={activeKey} onSelect={setActiveKey} />
        </div>

        <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 p-6">
          {activeKey === 'identity' && (
            <IdentityStep orgId={orgId} onDone={goNext} status={activeStatus} />
          )}
          {activeKey === 'payment' && (
            <PaymentStep orgId={orgId} onDone={goNext} stepData={activeStepData} />
          )}
          {activeKey === 'property' && (
            <PropertyVerifStep orgId={orgId} onDone={goNext} status={activeStatus} stepData={activeStepData} properties={properties} />
          )}
          {activeKey === 'ota' && (
            <OtaStep orgId={orgId} onDone={goNext} status={activeStatus} stepData={activeStepData} />
          )}
          {activeKey === 'calendar' && (
            <CalendarStep orgId={orgId} onDone={goNext} status={activeStatus} />
          )}
          {activeKey === 'domain' && (
            <DomainStep orgId={orgId} onDone={goNext} status={activeStatus} stepData={activeStepData} orgSlug={orgSlug} requireCustomDomain={requireCustomDomain} />
          )}
          {activeKey === 'admin' && (
            <AdminApprovalStep progress={progress} autoApprove={adminAutoApprove} />
          )}

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            <button onClick={goPrev} disabled={!hasPrev} className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={14} /> Previous
            </button>
            <button onClick={goNext} disabled={!hasNext} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Next step <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
