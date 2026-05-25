import { Lock, X, CreditCard, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BillingStatus } from '@/types'

interface Props {
  billing: BillingStatus | null
  onClose: () => void
}

export function QuotaExceededModal({ billing, onClose }: Props) {
  const navigate = useNavigate()

  const isInactive = billing && !billing.accessActive
  const isQuotaFull = billing && billing.accessActive && billing.usedLocks >= billing.lockQuota

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              {isInactive ? (
                <AlertTriangle size={20} className="text-red-500" />
              ) : (
                <Lock size={20} className="text-amber-500" />
              )}
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {isInactive ? 'Subscription Required' : 'Lock Limit Reached'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isInactive ? (
            <p className="text-gray-600 text-sm leading-relaxed">
              Your trial has expired or subscription is inactive. Subscribe to connect locks and
              automate access codes.
            </p>
          ) : (
            <>
              <p className="text-gray-600 text-sm leading-relaxed">
                You've used all {billing?.lockQuota} lock{billing?.lockQuota !== 1 ? 's' : ''} in
                your current plan. To add more locks, upgrade your lock quota in billing settings.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current usage</span>
                  <span className="font-semibold text-gray-900">
                    {billing?.usedLocks} / {billing?.lockQuota} locks
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${billing ? Math.min(100, (billing.usedLocks / billing.lockQuota) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Pricing: $2 per lock/month. Add as many locks as you need.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose()
              navigate('/billing')
            }}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            {isInactive ? 'Subscribe' : 'Upgrade Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
