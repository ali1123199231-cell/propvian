import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Lock, Check, AlertTriangle, Clock, Minus, Plus, Zap, Building2, DollarSign, ArrowRight, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { propertiesApi } from '@/api/properties'
import { TopBar } from '@/components/layout/TopBar'
import { BillingStatus } from '@/types'

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  TRIALING: { label: 'Free Trial', color: 'text-blue-600 bg-blue-50' },
  ACTIVE: { label: 'Active', color: 'text-emerald-600 bg-emerald-50' },
  PAST_DUE: { label: 'Payment Due', color: 'text-red-600 bg-red-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600 bg-gray-100' },
  EXPIRED: { label: 'Expired', color: 'text-red-600 bg-red-50' },
}

function TrialBanner({ billing }: { billing: BillingStatus }) {
  if (!billing.trialActive || !billing.trialEnd) return null
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(billing.trialEnd).getTime() - Date.now()) / 86_400_000)
  )
  return (
    <div className="card p-4 bg-blue-50 border border-blue-200 flex items-start gap-3">
      <Clock size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-blue-800">
          Free trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Trial ends {format(parseISO(billing.trialEnd), 'MMMM d, yyyy')}. Subscribe to keep
          automation running and add more than 1 property.
        </p>
      </div>
    </div>
  )
}

function PaymentFailedBanner({ billing }: { billing: BillingStatus }) {
  if (billing.status !== 'PAST_DUE') return null
  return (
    <div className="card p-4 bg-red-50 border border-red-200 flex items-start gap-3">
      <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-800">Payment failed</p>
        <p className="text-xs text-red-600 mt-0.5">
          Your last payment could not be processed
          {billing.failedPaymentAt
            ? ` on ${format(parseISO(billing.failedPaymentAt), 'MMM d, yyyy')}`
            : ''}
          . Update your payment method to restore access.
        </p>
      </div>
    </div>
  )
}

function QuotaCard({ billing }: { billing: BillingStatus }) {
  const pct = billing.lockQuota > 0 ? (billing.usedLocks / billing.lockQuota) * 100 : 0
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock size={18} className="text-primary-600" />
        <h3 className="font-semibold text-gray-800">Lock Quota</h3>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-3xl font-bold text-gray-900">{billing.usedLocks}</span>
        <span className="text-sm text-gray-400">/ {billing.lockQuota} locks</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {billing.trialActive
          ? 'Trial: 1 lock maximum. Subscribe to add more.'
          : `$2 per lock/month — ${billing.lockQuota - billing.usedLocks} slot${
              billing.lockQuota - billing.usedLocks !== 1 ? 's' : ''
            } available`}
      </p>
    </div>
  )
}

function QuotaEditor({ billing, orgId }: { billing: BillingStatus; orgId: string }) {
  const queryClient = useQueryClient()
  const [qty, setQty] = useState(billing.lockQuota)

  const mutation = useMutation({
    mutationFn: (q: number) => billingApi.updateQuota(orgId, q),
    onSuccess: (data) => {
      queryClient.setQueryData(['billing-status', orgId], data)
    },
  })

  const changed = qty !== billing.lockQuota

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Manage Lock Quota</h3>
      <p className="text-sm text-gray-500 mb-4">
        Adjust how many locks your plan includes. Billed at $2/lock/month.
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1">
          <button
            className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= Math.max(1, billing.usedLocks)}
          >
            <Minus size={16} />
          </button>
          <span className="text-xl font-bold text-gray-900 w-8 text-center">{qty}</span>
          <button
            className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">${qty * 2}</span>/month
        </div>
        {changed && (
          <button
            className="btn-primary ml-auto"
            onClick={() => mutation.mutate(qty)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>
      {mutation.isSuccess && !changed && (
        <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
          <Check size={12} /> Quota updated successfully
        </p>
      )}
    </div>
  )
}

function SubscribeCard({ orgId, billing }: { orgId: string; billing: BillingStatus }) {
  const [qty, setQty] = useState(Math.max(1, billing.usedLocks))
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null)

  const handleStripe = async () => {
    setLoading('stripe')
    billingApi.trackEvent(orgId, 'BILLING_STRIPE_CLICK', { quantity: qty, amount: qty * 2 })
    try {
      const url = await billingApi.createStripeCheckout(orgId, qty)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  const handlePaypal = async () => {
    setLoading('paypal')
    billingApi.trackEvent(orgId, 'BILLING_PAYPAL_CLICK', { quantity: qty, amount: qty * 2 })
    try {
      const url = await billingApi.createPaypalCheckout(orgId, qty)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Zap size={20} className="text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Subscribe — $2 / lock / month</h3>
          <p className="text-xs text-gray-500">No setup fees. Cancel anytime.</p>
        </div>
      </div>

      <div className="mt-4 mb-5 space-y-2">
        {[
          'Unlimited calendar syncs',
          'Automated TTLock access codes',
          'Host arrival notifications',
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <Check size={14} className="text-emerald-500 flex-shrink-0" />
            {f}
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-sm text-gray-500 mb-2">
          How many locks do you need?
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="text-xl font-bold text-gray-900 w-8 text-center">{qty}</span>
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="text-sm text-gray-500">
            = <span className="font-semibold text-gray-900">${qty * 2}</span>/month
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleStripe}
          disabled={loading !== null}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <CreditCard size={16} />
          {loading === 'stripe' ? 'Redirecting…' : 'Pay with Card (Stripe)'}
        </button>
        <button
          onClick={handlePaypal}
          disabled={loading !== null}
          className="flex-1 py-2.5 px-4 border-2 border-[#0070ba] text-[#0070ba] font-semibold rounded-xl hover:bg-[#f0f7ff] transition-colors flex items-center justify-center gap-2"
        >
          <span className="font-bold text-[#003087]">Pay</span>
          <span className="font-bold text-[#009cde]">Pal</span>
          {loading === 'paypal' ? '…' : ''}
        </button>
      </div>
    </div>
  )
}

function ManageBillingCard({ orgId, billing }: { orgId: string; billing: BillingStatus }) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    setLoading(true)
    try {
      const url = await billingApi.createStripePortal(orgId)
      window.location.href = url
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not open billing portal.')
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <CreditCard size={20} className="text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Billing Management</h3>
          <p className="text-xs text-gray-500">
            Provider:{' '}
            {billing.paymentProvider === 'STRIPE'
              ? 'Stripe (card)'
              : billing.paymentProvider === 'PAYPAL'
              ? 'PayPal'
              : '—'}
          </p>
        </div>
      </div>
      {billing.currentPeriodEnd && (
        <p className="text-sm text-gray-500 mb-4">
          {billing.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
          <span className="font-medium text-gray-700">
            {format(parseISO(billing.currentPeriodEnd), 'MMMM d, yyyy')}
          </span>
        </p>
      )}
      {billing.paymentProvider === 'STRIPE' && (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <CreditCard size={16} />
          {loading ? 'Redirecting…' : 'Manage Subscription'}
        </button>
      )}
      {billing.paymentProvider === 'PAYPAL' && (
        <p className="text-sm text-gray-400">
          To manage your PayPal subscription, log in to your PayPal account and manage billing
          agreements.
        </p>
      )}
    </div>
  )
}

// ── Direct Booking Subscribe Buttons ─────────────────────────────────────────

function DirectBookingSubscribeButtons({ orgId, activeCount }: { orgId: string; activeCount: number }) {
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null)
  const qty = Math.max(1, activeCount)

  const handleStripe = async () => {
    setLoading('stripe')
    billingApi.trackEvent(orgId, 'BILLING_STRIPE_CLICK', { quantity: qty, amount: qty * 10 })
    try {
      const url = await billingApi.createStripeCheckout(orgId, qty)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  const handlePaypal = async () => {
    setLoading('paypal')
    billingApi.trackEvent(orgId, 'BILLING_PAYPAL_CLICK', { quantity: qty, amount: qty * 10 })
    try {
      const url = await billingApi.createPaypalCheckout(orgId, qty)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Subscribe to activate your plan: <span className="font-semibold text-gray-800">${qty * 10}/month</span> for {qty} active propert{qty !== 1 ? 'ies' : 'y'}.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleStripe}
          disabled={loading !== null}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <CreditCard size={16} />
          {loading === 'stripe' ? 'Redirecting…' : 'Pay with Card (Stripe)'}
        </button>
        <button
          onClick={handlePaypal}
          disabled={loading !== null}
          className="flex-1 py-2.5 px-4 border-2 border-[#0070ba] text-[#0070ba] font-semibold rounded-xl hover:bg-[#f0f7ff] transition-colors flex items-center justify-center gap-2"
        >
          <span className="font-bold text-[#003087]">Pay</span>
          <span className="font-bold text-[#009cde]">Pal</span>
          {loading === 'paypal' ? '…' : ''}
        </button>
      </div>
    </div>
  )
}

// ── Direct Booking Billing ────────────────────────────────────────────────────

function DirectBookingBilling({ orgId, onPortal }: { orgId: string; onPortal: () => void }) {
  const queryClient = useQueryClient()
  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId],
    queryFn: () => propertiesApi.list(orgId, 0, 100),
    enabled: !!orgId,
  })
  const { data: billing } = useQuery({
    queryKey: ['billing-status', orgId],
    queryFn: () => billingApi.getStatus(orgId),
    enabled: !!orgId,
  })

  const syncMut = useMutation({
    mutationFn: () => billingApi.syncSubscription(orgId),
    onSuccess: (data) => {
      queryClient.setQueryData(['billing-status', orgId], data)
      toast.success('Subscription status synced from Stripe')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Sync failed'),
  })
  const activeCount = propsData?.content.filter(p => p.status === 'ACTIVE').length ?? 0
  const monthlyTotal = activeCount * 10
  const statusInfo = billing ? STATUS_INFO[billing.status] ?? STATUS_INFO.EXPIRED : null

  return (
    <div className="space-y-4">
      {/* Plan summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <CreditCard size={22} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Current plan</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-lg font-bold text-gray-900">Propvian Direct · $10 / property / month</p>
              {statusInfo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
              {billing?.paymentProvider === 'STRIPE' && (
                <button
                  onClick={() => syncMut.mutate()}
                  disabled={syncMut.isPending}
                  title="Sync status from Stripe"
                  className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={syncMut.isPending ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Active properties</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-primary-600">${monthlyTotal}</p>
            <p className="text-xs text-gray-400 mt-0.5">Per month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">${monthlyTotal * 12}</p>
            <p className="text-xs text-gray-400 mt-0.5">Per year (est.)</p>
          </div>
        </div>
      </div>

      {/* Trial / payment-failed banners */}
      {billing && <TrialBanner billing={billing} />}
      {billing && <PaymentFailedBanner billing={billing} />}

      {/* Billing model explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign size={15} className="text-primary-500" /> How billing works
        </h3>
        <ul className="space-y-2">
          {[
            'Billed monthly based on the number of active properties',
            'Add or remove properties anytime — billing adjusts automatically',
            'No setup fees, no contracts, cancel anytime',
            'Stripe & PayPal guest payments go directly to your account — Propvian never touches guest funds',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Properties list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={15} className="text-primary-500" /> Properties on this plan
          </h3>
          <Link to="/properties" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            Manage <ArrowRight size={11} />
          </Link>
        </div>
        {!propsData?.content.length ? (
          <p className="text-sm text-gray-400 text-center py-4">No properties yet</p>
        ) : (
          <div className="space-y-2">
            {propsData.content.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.city}{p.country ? `, ${p.country}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{p.status}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {p.status === 'ACTIVE' ? '$10/mo' : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage / Subscribe */}
      <ManageOrSubscribeSection
        orgId={orgId}
        billing={billing ?? null}
        activeCount={activeCount}
      />
    </div>
  )
}

function ManageOrSubscribeSection({
  orgId, billing, activeCount,
}: {
  orgId: string
  billing: BillingStatus | null
  activeCount: number
}) {
  const [showProviderPicker, setShowProviderPicker] = useState(false)
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null)
  const qty = Math.max(1, activeCount)

  const handleSwitchStripe = async () => {
    setLoading('stripe')
    try {
      const url = await billingApi.createStripePortal(orgId)
      window.location.href = url
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not open billing portal.')
      setLoading(null)
    }
  }

  const handleSwitchPaypal = async () => {
    setLoading('paypal')
    try {
      const url = await billingApi.createPaypalCheckout(orgId, qty)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  if (!billing?.paymentProvider) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Subscribe</h3>
        <DirectBookingSubscribeButtons orgId={orgId} activeCount={activeCount} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-3">Manage subscription</h3>
      {!showProviderPicker ? (
        <>
          <button
            onClick={() => setShowProviderPicker(true)}
            className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 justify-center"
          >
            <CreditCard size={14} /> Update payment method
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Current provider: {billing.paymentProvider === 'STRIPE' ? 'Stripe (card)' : 'PayPal'}. Click to update or switch.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Choose your payment provider:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSwitchStripe}
              disabled={loading !== null}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
            >
              <CreditCard size={16} />
              {loading === 'stripe' ? 'Redirecting…' : 'Stripe (card)'}
            </button>
            <button
              onClick={handleSwitchPaypal}
              disabled={loading !== null}
              className="flex-1 py-2.5 px-4 border-2 border-[#0070ba] text-[#0070ba] font-semibold rounded-xl hover:bg-[#f0f7ff] transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-bold text-[#003087]">Pay</span>
              <span className="font-bold text-[#009cde]">Pal</span>
              {loading === 'paypal' ? '…' : ''}
            </button>
          </div>
          <button
            onClick={() => setShowProviderPicker(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ── TTLock Billing (extracted to avoid hooks violation) ───────────────────────

function TTLockBillingPage({ orgId }: { orgId: string | undefined }) {
  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing-status', orgId],
    queryFn: () => billingApi.getStatus(orgId!),
    enabled: !!orgId,
  })

  const statusInfo = billing ? STATUS_INFO[billing.status] ?? STATUS_INFO.EXPIRED : null

  return (
    <div>
      <TopBar title="Billing" />
      <div className="p-6 space-y-4">
        {isLoading && (
          <div className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/4" />
          </div>
        )}

        {billing && (
          <>
            {/* Status header */}
            <div className="card p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CreditCard size={22} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Subscription Status</p>
                <div className="flex items-center gap-3 mt-1">
                  {statusInfo && (
                    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Propvian · $2 / lock / month
                  </span>
                </div>
              </div>
            </div>

            {/* Banners */}
            <TrialBanner billing={billing} />
            <PaymentFailedBanner billing={billing} />

            {/* Quota card */}
            <QuotaCard billing={billing} />

            {/* Subscribe (trial / inactive) OR quota editor + manage (active) */}
            {!billing.paidActive ? (
              <SubscribeCard orgId={orgId!} billing={billing} />
            ) : (
              <>
                <QuotaEditor billing={billing} orgId={orgId!} />
                <ManageBillingCard orgId={orgId!} billing={billing} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────

export function BillingPage() {
  const { activeOrg } = useAuthStore()
  const { isDirectBooking } = useSystemStore()
  const orgId = activeOrg?.id

  if (isDirectBooking()) {
    const handlePortal = async () => {
      try {
        const url = await billingApi.createStripePortal(orgId ?? '')
        window.location.href = url
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Could not open billing portal.')
      }
    }
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 mt-1">Subscription and payment management</p>
        </div>
        <DirectBookingBilling orgId={orgId ?? ''} onPortal={handlePortal} />
      </div>
    )
  }

  return <TTLockBillingPage orgId={orgId} />
}
