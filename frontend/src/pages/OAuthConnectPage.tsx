import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck, ExternalLink } from 'lucide-react'
import { verificationApi } from '@/api/verification'

// ── Stripe Connect form ───────────────────────────────────────────────────────

function StripeConnectForm({ orgId }: { orgId: string }) {
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const authorize = async () => {
    const val = accountId.trim()
    if (!val) { setError('Enter your Stripe Account ID'); return }
    if (!val.startsWith('acct_')) { setError('Stripe Account IDs start with acct_'); return }
    setLoading(true); setError('')
    try {
      await verificationApi.connectPayment(orgId, {
        stripeAccountId: val,
        chargesEnabled:  true,
        payoutsEnabled:  true,
      })
      window.opener?.postMessage({
        type:           'OAUTH_CALLBACK',
        provider:       'stripe',
        status:         'success',
        accountId:      val,
        chargesEnabled: true,
        payoutsEnabled: true,
      }, window.location.origin)
      window.location.href = `/oauth-callback?provider=stripe&status=success&accountId=${encodeURIComponent(val)}&chargesEnabled=true&payoutsEnabled=true`
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* Stripe-branded header */}
        <div className="bg-[#635bff] px-6 py-5 flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Stripe Connect</p>
            <p className="text-white/70 text-xs">Propvian wants to connect to your account</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* What Propvian will access */}
          <div className="bg-[#f6f9fc] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Propvian will be able to:</p>
            {[
              'Create and manage charges on your behalf',
              'View your account balance and payouts',
              'Process refunds for guest bookings',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <ShieldCheck size={13} className="text-[#635bff] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{item}</span>
              </div>
            ))}
          </div>

          {/* Account ID input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stripe Account ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={e => { setAccountId(e.target.value); setError('') }}
              placeholder="acct_1234567890AbCdEf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && authorize()}
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            <p className="mt-1.5 text-xs text-gray-400">
              Find this in{' '}
              <a
                href="https://dashboard.stripe.com/settings/account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#635bff] hover:underline inline-flex items-center gap-0.5"
              >
                Stripe Dashboard → Settings → Account details
                <ExternalLink size={10} />
              </a>
            </p>
          </div>

          {/* Authorize button */}
          <button
            onClick={authorize}
            disabled={loading || !accountId.trim()}
            className="w-full bg-[#635bff] hover:bg-[#4f49d4] disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Connecting…' : 'Authorize access'}
          </button>

          <button
            onClick={() => window.close()}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Cancel
          </button>
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">
            Your credentials are never shared with Propvian — only your account ID is stored.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── PayPal Connect form ────────────────────────────────────────────────────────

function PayPalConnectForm({ orgId }: { orgId: string }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const authorize = async () => {
    const val = email.trim()
    if (!val || !val.includes('@')) { setError('Enter a valid PayPal business email'); return }
    setLoading(true); setError('')
    try {
      await verificationApi.connectPayment(orgId, { paypalAccountId: val })
      window.opener?.postMessage({
        type:     'OAUTH_CALLBACK',
        provider: 'paypal',
        status:   'success',
        email:    val,
      }, window.location.origin)
      window.location.href = `/oauth-callback?provider=paypal&status=success&email=${encodeURIComponent(val)}`
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* PayPal-branded header */}
        <div className="bg-[#003087] px-6 py-5 flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white flex-shrink-0">
            <path d="M20.067 8.478c.492.315.844.825.983 1.39.372 1.514-.565 3.233-2.122 3.942-.52.233-1.113.368-1.754.368H15.67a.497.497 0 0 0-.491.42l-.526 3.352-.147.927H12.93a.294.294 0 0 1-.29-.337l.949-6.024c.04-.252.257-.435.512-.435h2.34c.58 0 1.122-.097 1.61-.287.488-.189.905-.467 1.239-.822.335-.356.584-.79.727-1.294zm-7.47-.534h2.26c1.83 0 3.28.584 3.792 1.693.224.482.3 1.023.223 1.618-.33 2.518-1.864 3.74-4.537 3.74h-.94a.497.497 0 0 0-.49.42l-.527 3.35-.149.944H10.64a.295.295 0 0 1-.29-.338l1.756-11.09c.04-.252.258-.437.512-.437zm-4.24 0h2.26c.902 0 1.698.149 2.38.443-.298 2.197-1.8 3.347-4.28 3.347h-1.24a.497.497 0 0 0-.49.42l-.527 3.35h-1.59a.295.295 0 0 1-.29-.338L6.43 8.356c.04-.252.258-.412.512-.412h1.415z"/>
          </svg>
          <div>
            <p className="text-white font-bold text-lg leading-tight">PayPal</p>
            <p className="text-white/70 text-xs">Connect your business account to Propvian</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="bg-[#f5f7fa] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Propvian will be able to:</p>
            {[
              'Receive payments on your behalf',
              'View your account profile and email',
              'Process refunds for guest bookings',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <ShieldCheck size={13} className="text-[#0070ba] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{item}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PayPal Business Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@yourbusiness.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && authorize()}
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            <p className="mt-1.5 text-xs text-gray-400">
              Use the email address associated with your PayPal Business account.
            </p>
          </div>

          <button
            onClick={authorize}
            disabled={loading || !email.trim()}
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Connecting…' : 'Log In & Authorize'}
          </button>

          <button
            onClick={() => window.close()}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Cancel
          </button>
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">
            Your PayPal password is never shared with Propvian.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Router ─────────────────────────────────────────────────────────────────────

export function OAuthConnectPage() {
  const [params] = useSearchParams()
  const provider = params.get('provider') ?? 'stripe'
  const orgId    = params.get('orgId') ?? ''

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">Missing orgId parameter</p>
      </div>
    )
  }

  return provider === 'paypal'
    ? <PayPalConnectForm orgId={orgId} />
    : <StripeConnectForm orgId={orgId} />
}
