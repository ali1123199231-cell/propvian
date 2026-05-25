import { apiClient } from '@/api/client'
import { BillingStatus } from '@/types'

export const billingApi = {
  getStatus: async (orgId: string): Promise<BillingStatus> => {
    const res = await apiClient.get(`/organizations/${orgId}/billing`)
    return res.data.data
  },

  createStripeCheckout: async (orgId: string, quantity: number): Promise<string> => {
    const res = await apiClient.post(`/organizations/${orgId}/billing/checkout/stripe`, { quantity })
    return res.data.data.url
  },

  createStripePortal: async (orgId: string): Promise<string> => {
    const res = await apiClient.post(`/organizations/${orgId}/billing/portal/stripe`)
    return res.data.data.url
  },

  createPaypalCheckout: async (orgId: string, quantity: number): Promise<string> => {
    const res = await apiClient.post(`/organizations/${orgId}/billing/checkout/paypal`, { quantity })
    return res.data.data.url
  },

  updateQuota: async (orgId: string, quantity: number): Promise<BillingStatus> => {
    const res = await apiClient.put(`/organizations/${orgId}/billing/quota`, { quantity })
    return res.data.data
  },
}
