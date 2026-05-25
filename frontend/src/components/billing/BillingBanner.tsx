import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, CreditCard, X } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'
import { BillingStatus } from '@/types'

function getBannerInfo(billing: BillingStatus): {
  variant: 'warning' | 'error' | 'info'
  message: string
  action?: string
} | null {
  if (billing.status === 'PAST_DUE') {
    return {
      variant: 'error',
      message: 'Payment failed. Your access will be suspended soon.',
      action: 'Update payment method',
    }
  }
  if (billing.status === 'CANCELLED' || billing.status === 'EXPIRED') {
    return {
      variant: 'error',
      message: 'Your subscription has ended. Subscribe to continue using automation.',
      action: 'Subscribe now',
    }
  }
  if (billing.trialActive && billing.trialEnd) {
    const daysLeft = differenceInDays(parseISO(billing.trialEnd), new Date())
    if (daysLeft <= 7) {
      return {
        variant: 'warning',
        message: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Subscribe to keep your access.`,
        action: 'Subscribe',
      }
    }
  }
  if (billing.cancelAtPeriodEnd && billing.currentPeriodEnd) {
    const daysLeft = differenceInDays(parseISO(billing.currentPeriodEnd), new Date())
    return {
      variant: 'warning',
      message: `Your subscription cancels in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
      action: 'Manage billing',
    }
  }
  return null
}

const VARIANT_STYLES = {
  warning: {
    wrapper: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-800',
    button: 'bg-amber-100 hover:bg-amber-200 text-amber-800',
    Icon: Clock,
  },
  error: {
    wrapper: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
    button: 'bg-red-100 hover:bg-red-200 text-red-800',
    Icon: AlertTriangle,
  },
  info: {
    wrapper: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    Icon: CreditCard,
  },
}

export function BillingBanner() {
  const { activeOrg } = useAuthStore()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const { data: billing } = useQuery({
    queryKey: ['billing-status', activeOrg?.id],
    queryFn: () => billingApi.getStatus(activeOrg!.id),
    enabled: !!activeOrg?.id,
    refetchInterval: 300000,
  })

  if (!billing || dismissed) return null

  const bannerInfo = getBannerInfo(billing)
  if (!bannerInfo) return null

  const styles = VARIANT_STYLES[bannerInfo.variant]
  const { Icon } = styles

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl mb-4 ${styles.wrapper}`}>
      <Icon size={18} className={`flex-shrink-0 ${styles.icon}`} />
      <p className={`flex-1 text-sm font-medium ${styles.text}`}>{bannerInfo.message}</p>
      {bannerInfo.action && (
        <button
          onClick={() => navigate('/billing')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${styles.button}`}
        >
          {bannerInfo.action}
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className={`p-1 rounded-lg transition-colors flex-shrink-0 ${styles.button}`}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
