import { useQuery } from '@tanstack/react-query'
import { CreditCard, DollarSign, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { verificationApi } from '@/api/verification'
import { directBookingApi } from '@/api/directBooking'
import { useAuthStore } from '@/store/authStore'

export function PaymentsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''

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

  const pStep          = verification?.paymentStep
  const hasStripe      = pStep?.status === 'APPROVED'
  const totalRevenue   = bookings?.content
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_OUT')
    .reduce((s, b) => s + (b.totalAmount ?? 0), 0) ?? 0

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Connect your payment accounts and view revenue</p>
      </div>

      {/* Architecture note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
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
            {pStep?.status === 'APPROVED' ? (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={14} /> Connected
              </div>
            ) : (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                Not connected
              </span>
            )}
          </div>
          {pStep?.status !== 'APPROVED' && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-500">Connect your Stripe account to accept card payments directly.</p>
              <Link
                to="/verification"
                className="btn-primary py-2 px-4 text-sm justify-center inline-flex items-center gap-2"
              >
                Connect via Verification Center <ExternalLink size={12} />
              </Link>
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
            <span className="text-xs text-gray-400">Optional</span>
          </div>
          <p className="text-sm text-gray-500">Connect PayPal Business as an additional payment option for guests.</p>
          <Link to="/verification" className="btn-secondary py-2 px-4 text-sm mt-3 inline-flex items-center gap-2">
            Connect PayPal <ExternalLink size={12} />
          </Link>
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
