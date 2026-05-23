import { useQuery } from '@tanstack/react-query'
import { CreditCard, Check, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { apiClient } from '@/api/client'

interface Plan {
  id: string
  name: string
  tier: string
  monthlyPrice: number
  yearlyPrice: number
  maxProperties: number
  maxLocks: number
  maxMembers: number
  features: Record<string, boolean>
}

interface Subscription {
  id: string
  status: string
  currentPeriodEnd: string
  plan: Plan
  cancelAtPeriodEnd: boolean
}

async function getPlans(): Promise<Plan[]> {
  const res = await apiClient.get('/subscriptions/plans')
  return res.data.data
}

async function getSubscription(orgId: string): Promise<Subscription | null> {
  try {
    const res = await apiClient.get(`/organizations/${orgId}/subscription`)
    return res.data.data
  } catch {
    return null
  }
}

const TIER_COLORS: Record<string, string> = {
  FREE: 'text-gray-700',
  STARTER: 'text-blue-700',
  PROFESSIONAL: 'text-primary-700',
  ENTERPRISE: 'text-amber-700',
}

const TIER_BORDER: Record<string, string> = {
  FREE: 'border-gray-300',
  STARTER: 'border-blue-400',
  PROFESSIONAL: 'border-primary-500',
  ENTERPRISE: 'border-amber-400',
}

export function BillingPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlans,
  })

  const { data: subscription } = useQuery({
    queryKey: ['subscription', orgId],
    queryFn: () => getSubscription(orgId!),
    enabled: !!orgId,
  })

  const currentTier = subscription?.plan?.tier ?? 'FREE'

  return (
    <div>
      <TopBar title="Billing" />
      <div className="p-6 space-y-6">
        {/* Current plan */}
        {subscription && (
          <div className="card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <CreditCard size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className={`text-xl font-bold ${TIER_COLORS[currentTier] ?? 'text-gray-900'}`}>
                {subscription.plan.name}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${subscription.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {subscription.status}
                </span>
                {subscription.cancelAtPeriodEnd && ' · Cancels at period end'}
              </p>
            </div>
          </div>
        )}

        {/* Plans grid */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans ?? []).map(plan => {
              const isCurrent = plan.tier === currentTier
              return (
                <div
                  key={plan.id}
                  className={`card p-5 flex flex-col gap-4 border-2 transition-all ${
                    isCurrent ? TIER_BORDER[plan.tier] : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-bold text-lg ${TIER_COLORS[plan.tier] ?? 'text-gray-900'}`}>{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}`}
                      {plan.monthlyPrice > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 flex-1">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <span>{plan.maxProperties === -1 ? 'Unlimited' : plan.maxProperties} properties</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <span>{plan.maxLocks === -1 ? 'Unlimited' : plan.maxLocks} locks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <span>{plan.maxMembers === -1 ? 'Unlimited' : plan.maxMembers} team members</span>
                    </div>
                    {Object.entries(plan.features ?? {}).filter(([, v]) => v).map(([feat]) => (
                      <div key={feat} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span className="capitalize">{feat.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                    ))}
                  </div>

                  {!isCurrent && (
                    <button
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        plan.tier === 'FREE'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'btn-primary'
                      }`}
                      onClick={() => {
                        alert(`Upgrade to ${plan.name} — Stripe integration required`)
                      }}
                    >
                      {plan.tier === 'FREE' ? 'Downgrade' : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Zap size={14} /> Upgrade
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
