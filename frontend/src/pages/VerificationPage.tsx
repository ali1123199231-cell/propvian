import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle, Clock, XCircle, Circle, ChevronRight, ChevronLeft,
  ShieldCheck, Home, Link, Calendar, CreditCard, Globe, BadgeCheck,
  Loader2, AlertTriangle, ExternalLink, Info, Upload, X, Copy,
  RefreshCw, Check, Plug, WifiOff, Wifi,
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
      const result = await fileUploadApi.upload(file, orgId)
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

  if (status === 'APPROVED') {
    return (
      <ApprovedState
        label="Payment Setup"
        note={
          stripeAccountId
            ? `Stripe ${stripeAccountId} · charges ${chargesEnabled ? '✓' : '✗'} · payouts ${payoutsEnabled ? '✓' : '✗'}`
            : paypalAccountId ? `PayPal: ${paypalAccountId}` : 'Payment account connected'
        }
      />
    )
  }

  if (status === 'PENDING') {
    return (
      <div className="space-y-4">
        <PendingState label="payment setup" />
        {stripeAccountId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <p><strong>Stripe {stripeAccountId}</strong> is connected but Stripe hasn't finished verifying your account yet.</p>
            <p className="mt-1 text-xs">Charges enabled: {chargesEnabled ? '✓' : 'pending'} · Payouts enabled: {payoutsEnabled ? '✓' : 'pending'}</p>
            <p className="mt-2 text-xs">Complete your Stripe onboarding to enable payouts, then reconnect below.</p>
            <button onClick={connectStripe} disabled={loadingStripe}
              className="mt-3 btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              {loadingStripe ? <Loader2 size={12} className="animate-spin" /> : null}
              Re-connect Stripe
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Stripe Account Connection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Stripe or PayPal account to receive direct payments. Stripe Connect also handles identity verification (KYC) so no separate ID upload is needed.
      </p>

      <InfoBox>
        <strong>How it works:</strong> Click a button below — a secure popup opens where you authorize the connection. We receive your account details automatically once you approve. Propvian never sees your passwords or banking details.
      </InfoBox>

      <div className="mt-5 space-y-4">
        {/* Stripe */}
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
              Charges enabled: {chargesEnabled ? '✓' : '✗'} · Payouts enabled: {payoutsEnabled ? '✓' : '✗'}
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

        {/* PayPal */}
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

// ── Step 3 (OTA Listings) ─────────────────────────────────────────────────────

function OtaStep({ orgId, onDone, status, stepData }: {
  orgId: string; onDone: () => void; status: VerificationStatus; stepData: any
}) {
  const qc = useQueryClient()
  const data: string[] = stepData?.data ?? []
  const verificationNote = data[2] || ''
  const reviewCount      = parseInt(data[3] || '0', 10)

  const schema = z.object({
    airbnbListingUrl:  z.string().url('Enter a valid URL').optional().or(z.literal('')),
    bookingListingUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    vrboListingUrl:    z.string().url('Enter a valid URL').optional().or(z.literal('')),
  }).refine(d => d.airbnbListingUrl || d.bookingListingUrl || d.vrboListingUrl, {
    message: 'Provide at least one active OTA listing URL',
    path: ['airbnbListingUrl'],
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: any) => {
    try {
      await verificationApi.submitOta(orgId, data)
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('OTA listings submitted — checking automatically…')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    }
  }

  if (status === 'APPROVED') return <ApprovedState label="OTA listings" note={verificationNote || undefined} />
  if (status === 'PENDING' && verificationNote) {
    return (
      <div>
        <PendingState label="OTA listings" />
        {verificationNote && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{verificationNote}</p>
            </div>
            {reviewCount > 0 && reviewCount < 3 && (
              <p className="text-xs text-amber-600 mt-2 ml-5">
                We currently work only with experienced hosts and require at least 3 reviews. Your listing shows {reviewCount} review(s).
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
  if (status === 'PENDING') return <PendingState label="OTA listings" />

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">OTA Listing Verification</h3>
      <p className="text-sm text-gray-500 mb-4">
        Provide at least one active OTA listing. We verify you're an experienced host automatically.
      </p>

      {status === 'REJECTED' && <div className="mb-4"><RejectedState label="OTA" reason={stepData?.rejectionReason} /></div>}

      <InfoBox>
        <strong>Auto-verification:</strong> We check your listing automatically. You must have at least 3 guest reviews to qualify. We currently work only with experienced hosts.
      </InfoBox>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">How to find your listing URL:</p>
        <a href="https://www.airbnb.com/hosting/listings" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline">
          <ExternalLink size={11} /> Airbnb → Listings → click your property → copy URL from browser
        </a>
        <a href="https://partner.booking.com/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline">
          <ExternalLink size={11} /> Booking.com → Partner Portal → Property → copy property URL
        </a>
        <a href="https://www.vrbo.com/en-us/owner" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline">
          <ExternalLink size={11} /> VRBO → My Properties → click property → copy URL from browser
        </a>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Airbnb listing URL</label>
          <input {...register('airbnbListingUrl')} className="input-base"
            placeholder="https://www.airbnb.com/rooms/12345678" />
          {errors.airbnbListingUrl && <p className="mt-1 text-xs text-red-500">{String(errors.airbnbListingUrl.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Booking.com listing URL</label>
          <input {...register('bookingListingUrl')} className="input-base"
            placeholder="https://www.booking.com/hotel/us/my-property.html" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">VRBO listing URL</label>
          <input {...register('vrboListingUrl')} className="input-base"
            placeholder="https://www.vrbo.com/1234567" />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSubmitting ? 'Verifying…' : 'Verify OTA listings'}
        </button>
      </form>
    </div>
  )
}

// ── Step 4 (Calendar) ─────────────────────────────────────────────────────────

function CalendarStep({ orgId, onDone, status }: {
  orgId: string; onDone: () => void; status: VerificationStatus
}) {
  const qc = useQueryClient()
  const schema = z.object({
    airbnbIcalUrl:  z.string().url('Enter a valid iCal URL').optional().or(z.literal('')),
    bookingIcalUrl: z.string().url('Enter a valid iCal URL').optional().or(z.literal('')),
    otherUrl:       z.string().url('Enter a valid URL').optional().or(z.literal('')),
  })
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'ok' | 'fail'>>({})
  const [testMessages, setTestMessages] = useState<Record<string, string>>({})

  const testUrl = async (field: string, url: string) => {
    if (!url) return
    setTestResults(r => ({ ...r, [field]: 'testing' }))
    try {
      const res = await verificationApi.testIcal(url)
      setTestResults(r => ({ ...r, [field]: res.success ? 'ok' : 'fail' }))
      setTestMessages(m => ({ ...m, [field]: res.message }))
    } catch {
      setTestResults(r => ({ ...r, [field]: 'fail' }))
      setTestMessages(m => ({ ...m, [field]: 'Connection failed' }))
    }
  }

  const onSubmit = async (data: any) => {
    const others = data.otherUrl ? [data.otherUrl] : []
    try {
      await verificationApi.connectCalendar(orgId, {
        airbnbIcalUrl:  data.airbnbIcalUrl || undefined,
        bookingIcalUrl: data.bookingIcalUrl || undefined,
        otherIcalUrls:  others,
      })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Calendar connected!')
      onDone()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Connection failed')
    }
  }

  function ICalField({ field, label, placeholder }: { field: string; label: string; placeholder: string }) {
    const url = watch(field as any) || ''
    const result = testResults[field]
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="flex gap-2">
          <input {...register(field as any)} className="input-base flex-1" placeholder={placeholder} />
          <button type="button" onClick={() => testUrl(field, url)}
            disabled={!url || result === 'testing'}
            className="btn-secondary text-xs px-3 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40">
            {result === 'testing' ? <Loader2 size={12} className="animate-spin" /> : 'Test'}
          </button>
        </div>
        {result === 'ok' && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
            <Wifi size={11} /> {testMessages[field] || 'Connection successful'}
          </div>
        )}
        {result === 'fail' && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
            <WifiOff size={11} /> {testMessages[field] || 'Connection failed'}
          </div>
        )}
        {errors[field as keyof typeof errors] && (
          <p className="mt-1 text-xs text-red-500">{String((errors[field as keyof typeof errors] as any)?.message)}</p>
        )}
      </div>
    )
  }

  if (status === 'APPROVED') return <ApprovedState label="Calendar" note="Your calendar syncs every 15 minutes automatically." />

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Calendar Synchronization</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your iCal feeds to prevent double bookings. At least one is required. Calendars sync every 15 minutes.
      </p>

      <InfoBox>
        <strong>Why iCal sync?</strong> We import your existing reservations so guests can't book dates that are already taken on Airbnb or Booking.com. Conflict detection happens in real time.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
        <ICalField field="airbnbIcalUrl" label="Airbnb iCal URL"
          placeholder="https://www.airbnb.com/calendar/ical/12345678.ics?s=…" />
        <ICalField field="bookingIcalUrl" label="Booking.com iCal URL"
          placeholder="https://ical.booking.com/v1/export?t=…" />
        <ICalField field="otherUrl" label="Other PMS / iCal URL (optional)"
          placeholder="https://yourpms.com/calendar/export.ics" />

        <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSubmitting ? 'Connecting…' : 'Connect calendars'}
        </button>
      </form>
    </div>
  )
}

// ── Step 5 (Domain) ───────────────────────────────────────────────────────────

function DomainStep({ orgId, onDone, status, stepData, orgSlug }: {
  orgId: string; onDone: () => void; status: VerificationStatus; stepData: any; orgSlug: string
}) {
  const qc = useQueryClient()
  const data: string[] = stepData?.data ?? []
  const savedDomain    = data[0] || ''
  const cnameTarget    = data[1] || 'booking.propvian.com'

  const schema = z.object({
    domain: z.string().min(4, 'Enter a valid domain')
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, 'Invalid domain format'),
  })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const [checking, setChecking] = useState(false)
  const [dnsResult, setDnsResult] = useState<{ verified: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

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

  const onSubmit = async (data: any) => {
    try {
      await verificationApi.connectDomain(orgId, { domain: data.domain })
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success(data.domain.endsWith('.propvian.com') ? `Using ${data.domain}` : 'Domain saved — add the CNAME below')
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

  if (status === 'APPROVED') return (
    <ApprovedState label="Domain" note={savedDomain ? `Your domain ${savedDomain} is live.` : 'Domain is verified.'} />
  )

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Domain Connection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect a custom domain so guests book on your brand. We'll provision SSL automatically.
      </p>

      {status === 'PENDING' && savedDomain && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">Pending DNS verification for <strong>{savedDomain}</strong></p>
          <p className="text-xs text-gray-600 mb-2">Add this CNAME record at your DNS provider:</p>
          <div className="bg-white border border-gray-200 rounded-lg p-3 font-mono text-xs flex items-center justify-between gap-2">
            <span className="text-gray-700">CNAME &nbsp; @ &nbsp;→ &nbsp;{cnameTarget}</span>
            <button onClick={() => copyToClipboard(cnameTarget)} className="flex-shrink-0 flex items-center gap-1 text-primary-600 hover:text-primary-800">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">DNS changes take 5–30 minutes to propagate.</p>
          <button onClick={checkDns} disabled={checking}
            className="mt-3 btn-primary text-sm py-2 flex items-center gap-2">
            {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {checking ? 'Checking…' : 'Check DNS now'}
          </button>
          {dnsResult && !dnsResult.verified && (
            <p className="mt-2 text-xs text-red-500">{dnsResult.message}</p>
          )}
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-green-800 mb-1">Quick option: Use a Propvian subdomain</p>
        <p className="text-xs text-green-600 mb-3">Skip DNS setup — use <strong>{subdomainUrl}</strong> instantly, no configuration needed.</p>
        <button onClick={useSubdomain} className="btn-primary text-sm py-2 px-4">
          Use {subdomainUrl}
        </button>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-3">Or connect your own domain:</p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-2">
        <p className="text-sm font-medium text-gray-700">DNS setup instructions</p>
        <p className="text-xs text-gray-500">After submitting, add this CNAME at your DNS provider:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 rounded px-3 py-2 text-gray-700 font-mono">
            CNAME → booking.propvian.com
          </code>
          <button onClick={() => copyToClipboard('booking.propvian.com')}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800">
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-400">DNS propagation: 5–30 minutes. We check automatically.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your domain</label>
          <input {...register('domain')} className="input-base" placeholder="myvilla.com" />
          {errors.domain && <p className="mt-1 text-xs text-red-500">{String(errors.domain.message)}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary justify-center py-2.5">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
          {isSubmitting ? 'Connecting…' : 'Connect domain'}
        </button>
      </form>
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
  const adminAutoApprove = sysConfig?.['verification.admin_auto_approve'] === 'true'

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
            <DomainStep orgId={orgId} onDone={goNext} status={activeStatus} stepData={activeStepData} orgSlug={orgSlug} />
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
