import { apiClient } from '@/api/client'
import { BillingStatus } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('BILLING')

export const billingApi = {
  getStatus: async (orgId: string): Promise<BillingStatus> => {
    log.debug('getStatus — org=%s', shortId(orgId))
    const res = await apiClient.get(`/organizations/${orgId}/billing`)
    const s = res.data.data as BillingStatus
    log.info('getStatus — status=%s access=%s locks=%d/%d trialActive=%s',
      s?.status, s?.accessActive, s?.usedLocks, s?.lockQuota, s?.trialActive)
    return s
  },

  createStripeCheckout: async (orgId: string, quantity: number): Promise<string> => {
    log.info('createStripeCheckout — org=%s quantity=%d', shortId(orgId), quantity)
    const res = await apiClient.post(`/organizations/${orgId}/billing/checkout/stripe`, { quantity })
    log.info('createStripeCheckout — redirect URL received')
    return res.data.data.url
  },

  createStripePortal: async (orgId: string): Promise<string> => {
    log.info('createStripePortal — org=%s', shortId(orgId))
    const res = await apiClient.post(`/organizations/${orgId}/billing/portal/stripe`)
    log.info('createStripePortal — portal URL received')
    return res.data.data.url
  },

  createPaypalCheckout: async (orgId: string, quantity: number): Promise<string> => {
    log.info('createPaypalCheckout — org=%s quantity=%d', shortId(orgId), quantity)
    const res = await apiClient.post(`/organizations/${orgId}/billing/checkout/paypal`, { quantity })
    log.info('createPaypalCheckout — redirect URL received')
    return res.data.data.url
  },

  updateQuota: async (orgId: string, quantity: number): Promise<BillingStatus> => {
    log.info('updateQuota — org=%s quantity=%d', shortId(orgId), quantity)
    const res = await apiClient.put(`/organizations/${orgId}/billing/quota`, { quantity })
    log.info('updateQuota — success')
    return res.data.data
  },

  syncSubscription: async (orgId: string): Promise<BillingStatus> => {
    log.info('syncSubscription — org=%s', shortId(orgId))
    const res = await apiClient.post(`/organizations/${orgId}/billing/sync`)
    log.info('syncSubscription — done status=%s', res.data.data?.subscriptionStatus)
    return res.data.data
  },

  trackEvent: async (orgId: string, eventType: string, metadata?: Record<string, unknown>): Promise<void> => {
    log.debug('trackEvent — org=%s event=%s', shortId(orgId), eventType)
    await apiClient.post(`/organizations/${orgId}/events/track`, { eventType, metadata }).catch((err) => {
      log.warn('trackEvent — silently failed', err?.message)
    })
  },
}
