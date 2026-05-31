import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings, Shield, Mail, CreditCard, Globe, Save, Eye, EyeOff, Loader2, ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { systemConfigApi } from '@/api/systemConfig'
import { useAuthStore } from '@/store/authStore'

// ── Masked input ──────────────────────────────────────────────────────────────

function MaskedInput({
  value, onChange, placeholder, className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-base pr-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabKey = 'general' | 'verification' | 'email' | 'payments' | 'platform'

const TABS: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'general',      label: 'General',      icon: Settings },
  { key: 'verification', label: 'Verification',  icon: Shield },
  { key: 'email',        label: 'Email',         icon: Mail },
  { key: 'payments',     label: 'Payments',      icon: CreditCard },
  { key: 'platform',     label: 'Platform',      icon: Globe },
]

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({
  value, onChange, label, hint,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none mt-0.5 ${value ? 'bg-primary-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  )
}

// ── Tab content components ────────────────────────────────────────────────────

function GeneralTab({
  cfg, onSave, saving,
}: {
  cfg: Record<string, string>
  onSave: (updates: Record<string, string>) => void
  saving: boolean
}) {
  const [model, setModel]       = useState(cfg['platform.business_model'] ?? 'ttlock')
  const [price, setPrice]       = useState(cfg['direct_booking.price_per_property'] ?? '10.00')

  return (
    <div className="space-y-5">
      <Field label="Business Model" hint="Controls which features and navigation are shown to users.">
        <div className="flex gap-4 mt-1">
          {[
            { v: 'ttlock',          label: 'TTLock',          desc: 'Smart lock management' },
            { v: 'direct_booking',  label: 'Direct Booking',  desc: 'Property booking website' },
          ].map(({ v, label, desc }) => (
            <label key={v} className={`flex-1 flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${model === v ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                value={v}
                checked={model === v}
                onChange={() => setModel(v)}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Price per property / month (USD)" hint="Charged to hosts for each active property in direct booking mode.">
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input-base w-40"
        />
      </Field>

      <div className="pt-2">
        <button
          onClick={() => onSave({
            'platform.business_model':          model,
            'direct_booking.price_per_property': price,
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save General'}
        </button>
      </div>
    </div>
  )
}

function VerificationTab({
  cfg, onSave, saving,
}: {
  cfg: Record<string, string>
  onSave: (updates: Record<string, string>) => void
  saving: boolean
}) {
  const [provider,       setProvider]       = useState(cfg['verification.identity_provider'] ?? 'manual')
  const [apiKey,         setApiKey]         = useState(cfg['verification.identity_provider_api_key'] ?? '')
  const [webhookSecret,  setWebhookSecret]  = useState(cfg['verification.identity_provider_webhook_secret'] ?? '')
  const [autoApproveId,  setAutoApproveId]  = useState(cfg['verification.identity_auto_approve'] === 'true')
  const [autoApproveAdm, setAutoApproveAdm] = useState(cfg['verification.admin_auto_approve'] === 'true')
  const [steps, setSteps] = useState({
    identity_check:  cfg['verification.identity_check.enabled']  !== 'false',
    property_check:  cfg['verification.property_check.enabled']  !== 'false',
    ota_check:       cfg['verification.ota_check.enabled']       !== 'false',
    calendar_sync:   cfg['verification.calendar_sync.enabled']   !== 'false',
    payment_setup:   cfg['verification.payment_setup.enabled']   !== 'false',
    domain_setup:    cfg['verification.domain_setup.enabled']    !== 'false',
    admin_approval:  cfg['verification.admin_approval.enabled']  !== 'false',
  })

  const toggleStep = (key: keyof typeof steps) => setSteps((s) => ({ ...s, [key]: !s[key] }))

  const STEP_LABELS: { key: keyof typeof steps; label: string }[] = [
    { key: 'identity_check',  label: 'Identity verification' },
    { key: 'property_check',  label: 'Property verification' },
    { key: 'ota_check',       label: 'OTA listing check' },
    { key: 'calendar_sync',   label: 'Calendar sync' },
    { key: 'payment_setup',   label: 'Payment setup' },
    { key: 'domain_setup',    label: 'Domain connection' },
    { key: 'admin_approval',  label: 'Admin approval' },
  ]

  return (
    <div className="space-y-5">
      <Field label="Identity Verification Provider">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="input-base"
        >
          <option value="stripe_identity">Stripe Identity</option>
          <option value="persona">Persona</option>
          <option value="onfido">Onfido</option>
          <option value="manual">Manual (URL upload)</option>
        </select>
      </Field>

      <Field label="Provider API Key" hint="Secret key from your identity provider dashboard.">
        <MaskedInput value={apiKey} onChange={setApiKey} placeholder="sk_live_…" />
      </Field>

      <Field label="Provider Webhook Secret" hint="Used to verify incoming webhooks from the provider.">
        <MaskedInput value={webhookSecret} onChange={setWebhookSecret} placeholder="whsec_…" />
      </Field>

      <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 divide-y divide-gray-100">
        <Toggle
          value={autoApproveId}
          onChange={setAutoApproveId}
          label="Auto-approve identity"
          hint="Automatically mark identity step APPROVED when provider returns 'verified'."
        />
        <Toggle
          value={autoApproveAdm}
          onChange={setAutoApproveAdm}
          label="Auto-approve admin"
          hint="Automatically grant admin approval when all other required steps pass."
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Verification Steps</p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 divide-y divide-gray-100">
          {STEP_LABELS.map(({ key, label }) => (
            <Toggle
              key={key}
              value={steps[key]}
              onChange={() => toggleStep(key)}
              label={label}
            />
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onSave({
            'verification.identity_provider':                provider,
            'verification.identity_provider_api_key':        apiKey,
            'verification.identity_provider_webhook_secret': webhookSecret,
            'verification.identity_auto_approve':            String(autoApproveId),
            'verification.admin_auto_approve':               String(autoApproveAdm),
            ...Object.fromEntries(
              STEP_LABELS.map(({ key }) => [`verification.${key}.enabled`, String(steps[key])])
            ),
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Verification'}
        </button>
      </div>
    </div>
  )
}

function EmailTab({
  cfg, onSave, saving,
}: {
  cfg: Record<string, string>
  onSave: (updates: Record<string, string>) => void
  saving: boolean
}) {
  const [emailProvider, setEmailProvider] = useState(cfg['email.provider'] ?? 'resend')
  const [apiKey,        setApiKey]        = useState(cfg['email.api_key'] ?? '')
  const [fromAddress,   setFromAddress]   = useState(cfg['email.from_address'] ?? 'noreply@propvian.com')
  const [fromName,      setFromName]      = useState(cfg['email.from_name'] ?? 'Propvian')

  return (
    <div className="space-y-5">
      <Field label="Email Provider">
        <select
          value={emailProvider}
          onChange={(e) => setEmailProvider(e.target.value)}
          className="input-base"
        >
          <option value="resend">Resend</option>
          <option value="sendgrid">SendGrid</option>
          <option value="mailgun">Mailgun</option>
          <option value="smtp">SMTP</option>
        </select>
      </Field>

      <Field label="API Key" hint="Found in your email provider dashboard.">
        <MaskedInput value={apiKey} onChange={setApiKey} placeholder="re_…" />
      </Field>

      <Field label="From Address" hint="The sender email address guests will see.">
        <input
          type="email"
          value={fromAddress}
          onChange={(e) => setFromAddress(e.target.value)}
          className="input-base"
          placeholder="noreply@propvian.com"
        />
      </Field>

      <Field label="From Name" hint="The sender name that appears in email clients.">
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          className="input-base"
          placeholder="Propvian"
        />
      </Field>

      <div className="pt-2">
        <button
          onClick={() => onSave({
            'email.provider':     emailProvider,
            'email.api_key':      apiKey,
            'email.from_address': fromAddress,
            'email.from_name':    fromName,
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Email'}
        </button>
      </div>
    </div>
  )
}

function PaymentsTab({
  cfg, onSave, saving,
}: {
  cfg: Record<string, string>
  onSave: (updates: Record<string, string>) => void
  saving: boolean
}) {
  const [stripeSecret,    setStripeSecret]    = useState(cfg['stripe.secret_key'] ?? '')
  const [stripePub,       setStripePub]       = useState(cfg['stripe.publishable_key'] ?? '')
  const [stripeWebhook,   setStripeWebhook]   = useState(cfg['stripe.webhook_secret'] ?? '')
  const [paypalClientId,  setPaypalClientId]  = useState(cfg['paypal.client_id'] ?? '')
  const [paypalSecret,    setPaypalSecret]    = useState(cfg['paypal.client_secret'] ?? '')
  const [paypalMode,      setPaypalMode]      = useState(cfg['paypal.mode'] ?? 'sandbox')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-xs font-bold">S</span>
          Stripe
        </p>
        <div className="space-y-4">
          <Field label="Secret Key" hint="Your Stripe secret key (sk_live_… or sk_test_…).">
            <MaskedInput value={stripeSecret} onChange={setStripeSecret} placeholder="sk_live_…" />
          </Field>
          <Field label="Publishable Key">
            <input
              type="text"
              value={stripePub}
              onChange={(e) => setStripePub(e.target.value)}
              className="input-base"
              placeholder="pk_live_…"
            />
          </Field>
          <Field label="Webhook Secret">
            <MaskedInput value={stripeWebhook} onChange={setStripeWebhook} placeholder="whsec_…" />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-yellow-500 text-white text-xs font-bold">P</span>
          PayPal
        </p>
        <div className="space-y-4">
          <Field label="Client ID">
            <input
              type="text"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              className="input-base"
              placeholder="AaBb…"
            />
          </Field>
          <Field label="Client Secret">
            <MaskedInput value={paypalSecret} onChange={setPaypalSecret} placeholder="EeFf…" />
          </Field>
          <Field label="Mode">
            <div className="flex gap-4 mt-1">
              {['sandbox', 'live'].map((m) => (
                <label key={m} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${paypalMode === m ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    value={m}
                    checked={paypalMode === m}
                    onChange={() => setPaypalMode(m)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{m}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onSave({
            'stripe.secret_key':      stripeSecret,
            'stripe.publishable_key': stripePub,
            'stripe.webhook_secret':  stripeWebhook,
            'paypal.client_id':       paypalClientId,
            'paypal.client_secret':   paypalSecret,
            'paypal.mode':            paypalMode,
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Payments'}
        </button>
      </div>
    </div>
  )
}

function PlatformTab({
  cfg, onSave, saving,
}: {
  cfg: Record<string, string>
  onSave: (updates: Record<string, string>) => void
  saving: boolean
}) {
  const [platformName,    setPlatformName]    = useState(cfg['platform.name'] ?? 'Propvian')
  const [supportEmail,    setSupportEmail]    = useState(cfg['platform.support_email'] ?? 'support@propvian.com')
  const [ttlockRedirect,  setTtlockRedirect]  = useState(cfg['ttlock.redirect_uri'] ?? '')
  const [ttlockAuthMethod, setTtlockAuthMethod] = useState(cfg['ttlock.auth_method'] ?? 'oauth')

  return (
    <div className="space-y-5">
      <Field label="Platform Name" hint="Displayed in emails, the UI, and public pages.">
        <input
          type="text"
          value={platformName}
          onChange={(e) => setPlatformName(e.target.value)}
          className="input-base"
          placeholder="Propvian"
        />
      </Field>

      <Field label="Support Email" hint="Shown to users when they need help.">
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          className="input-base"
          placeholder="support@propvian.com"
        />
      </Field>

      <Field label="TTLock Redirect URI" hint="The OAuth callback URL registered in TTLock developer portal.">
        <input
          type="url"
          value={ttlockRedirect}
          onChange={(e) => setTtlockRedirect(e.target.value)}
          className="input-base"
          placeholder="https://propvian.com/api/v1/ttlock/oauth/callback"
        />
      </Field>

      <Field label="TTLock Auth Method">
        <div className="flex gap-4 mt-1">
          {[
            { v: 'oauth',    label: 'OAuth',    desc: 'Redirect-based login' },
            { v: 'password', label: 'Password', desc: 'Direct credential login' },
          ].map(({ v, label, desc }) => (
            <label key={v} className={`flex-1 flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${ttlockAuthMethod === v ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                value={v}
                checked={ttlockAuthMethod === v}
                onChange={() => setTtlockAuthMethod(v)}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Field>

      <div className="pt-2">
        <button
          onClick={() => onSave({
            'platform.name':         platformName,
            'platform.support_email': supportEmail,
            'ttlock.redirect_uri':    ttlockRedirect,
            'ttlock.auth_method':     ttlockAuthMethod,
          })}
          disabled={saving}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Platform'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SystemConfigPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const qc = useQueryClient()

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <ShieldAlert size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">Access restricted</p>
        <p className="text-xs mt-1">This page is only available to platform administrators.</p>
      </div>
    )
  }

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['system-config-all'],
    queryFn:  () => systemConfigApi.getConfig(),
  })

  const { mutate: saveConfig, isPending: saving } = useMutation({
    mutationFn: (updates: Record<string, string>) => systemConfigApi.setConfig(updates),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['system-config-all'] })
      qc.invalidateQueries({ queryKey: ['system-config'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save settings')
    },
  })

  if (isLoading || !cfg) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-500 mt-1">Manage platform-wide settings. Changes take effect immediately.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'general'      && <GeneralTab      cfg={cfg} onSave={saveConfig} saving={saving} />}
        {activeTab === 'verification' && <VerificationTab cfg={cfg} onSave={saveConfig} saving={saving} />}
        {activeTab === 'email'        && <EmailTab        cfg={cfg} onSave={saveConfig} saving={saving} />}
        {activeTab === 'payments'     && <PaymentsTab     cfg={cfg} onSave={saveConfig} saving={saving} />}
        {activeTab === 'platform'     && <PlatformTab     cfg={cfg} onSave={saveConfig} saving={saving} />}
      </div>
    </div>
  )
}
