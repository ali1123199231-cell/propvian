import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, DollarSign, ExternalLink, CheckCircle, AlertTriangle, Loader2, ToggleLeft, ToggleRight, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { verificationApi } from '@/api/verification'
import { directBookingApi } from '@/api/directBooking'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

function useOAuthPopup(orgId: string) {
  const qc = useQueryClient()

  return async (getUrl: () => Promise<{ url: string; dev?: string }>, provider: string) => {
    let urlData: { url: string; dev?: string }
    try { urlData = await getUrl() } catch { toast.error('Failed to get connect URL'); return }

    const popup = window.open(urlData.url, `${provider}_oauth`,
      'width=700,height=700,scrollbars=yes,resizable=yes')
    if (!popup) { toast.error('Popup blocked — please allow popups'); return }

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
    const poll = setInterval(() => {
      if (popup.closed) { clearInterval(poll); window.removeEventListener('message', handleMessage) }
    }, 500)
  }
}

export function PaymentsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [loadingPaypal, setLoadingPaypal] = useState(false)
  const openPopup = useOAuthPopup(orgId)

  const { data: verification } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
  })

  const { data: bookings } = useQuery({
    queryKey: ['direct-bookings', orgId, 'all'],
    queryFn:  () => directBookingApi.list(orgId, 0, 200),
    enabled:  !!orgId,
  })

  const toggleMut = useMutation({
    mutationFn: ({ provider, enabled }: { provider: 'stripe' | 'paypal'; enabled: boolean }) =>
      verificationApi.togglePaymentMethod(orgId, provider, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification', orgId] }),
    onError: () => toast.error('Failed to update payment method'),
  })

  const pStep           = verification?.paymentStep
  const data            = (pStep?.data ?? []) as string[]
  const stripeAccountId = data[0] || ''
  const chargesEnabled  = data[1] === 'true'
  const payoutsEnabled  = data[2] === 'true'
  const paypalAccountId = data[3] || ''
  const stripeGuestEnabled = data[4] !== 'false'  // defaults true
  const paypalGuestEnabled = data[5] !== 'false'  // defaults true

  const hasStripe = !!stripeAccountId && chargesEnabled && payoutsEnabled
  const hasPaypal = !!paypalAccountId

  const totalRevenue = bookings?.content
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_OUT')
    .reduce((s, b) => s + (b.totalAmount ?? 0), 0) ?? 0

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

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Connect your payment accounts and view revenue</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <strong>Guest payments go directly to your account.</strong> Propvian never holds or processes guest funds.
          Connect Stripe Connect or PayPal Business below.
        </p>
      </div>

      {/* Revenue summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total confirmed revenue', value: `$${totalRevenue.toLocaleString()}` },
            { label: 'Confirmed bookings', value: bookings?.content.filter((b) => b.status === 'CONFIRMED').length ?? 0 },
            { label: 'Average booking value', value: bookings?.content.length
              ? `$${Math.round(totalRevenue / Math.max(1, bookings.content.length)).toLocaleString()}`
              : '$0'
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <h2 className="font-semibold text-gray-900">Payment Accounts</h2>

        {/* Stripe */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard size={18} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Stripe Connect</p>
                <p className="text-xs text-gray-400">Recommended — instant payouts</p>
              </div>
            </div>
            {hasStripe ? (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={14} /> Connected
              </div>
            ) : stripeAccountId ? (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                Setup in progress
              </span>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                Not connected
              </span>
            )}
          </div>

          {hasStripe ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Account: <span className="font-medium text-gray-700">{stripeAccountId}</span></p>
                <button
                  onClick={connectStripe}
                  disabled={loadingStripe}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  {loadingStripe ? <Loader2 size={11} className="animate-spin" /> : <LinkIcon size={11} />}
                  Re-connect
                </button>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">Accept Stripe payments from guests</p>
                  <p className="text-xs text-gray-400">Toggle off to temporarily disable card payments on your booking page</p>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ provider: 'stripe', enabled: !stripeGuestEnabled })}
                  disabled={toggleMut.isPending}
                  className="flex-shrink-0 ml-3"
                >
                  {stripeGuestEnabled
                    ? <ToggleRight size={28} className="text-indigo-600" />
                    : <ToggleLeft size={28} className="text-gray-400" />
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-500">Connect your Stripe account to accept card payments directly.</p>
              <button
                onClick={connectStripe}
                disabled={loadingStripe}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                {loadingStripe ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {loadingStripe ? 'Opening Stripe…' : stripeAccountId ? 'Re-connect Stripe' : 'Connect with Stripe'}
              </button>
              {stripeAccountId && (
                <p className="text-xs text-amber-600">
                  Your account is being verified by Stripe. Once charges and payouts are enabled, you're all set.
                </p>
              )}
            </div>
          )}
        </div>

        {/* PayPal */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign size={18} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal Business</p>
                <p className="text-xs text-gray-400">Alternative payment method</p>
              </div>
            </div>
            {hasPaypal ? (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={14} /> Connected
              </div>
            ) : (
              <span className="text-xs text-gray-400">Optional</span>
            )}
          </div>

          {hasPaypal ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Account: <span className="font-medium text-gray-700">{paypalAccountId}</span></p>
                <button
                  onClick={connectPaypal}
                  disabled={loadingPaypal}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                >
                  {loadingPaypal ? <Loader2 size={11} className="animate-spin" /> : <LinkIcon size={11} />}
                  Re-connect
                </button>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">Accept PayPal payments from guests</p>
                  <p className="text-xs text-gray-400">Toggle off to temporarily disable PayPal on your booking page</p>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ provider: 'paypal', enabled: !paypalGuestEnabled })}
                  disabled={toggleMut.isPending}
                  className="flex-shrink-0 ml-3"
                >
                  {paypalGuestEnabled
                    ? <ToggleRight size={28} className="text-blue-500" />
                    : <ToggleLeft size={28} className="text-gray-400" />
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Connect PayPal Business as an additional payment option for guests.</p>
              <button
                onClick={connectPaypal}
                disabled={loadingPaypal}
                className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
              >
                {loadingPaypal ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                {loadingPaypal ? 'Opening PayPal…' : 'Connect PayPal'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Propvian subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Propvian Subscription</h2>
        <p className="text-sm text-gray-500 mb-3">
          <strong>$10/month per active property.</strong> Billed monthly. Cancel anytime.
        </p>
        <Link to="/billing" className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-2">
          Manage subscription <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}
