import { apiClient } from './client'

type Res<T> = { success: boolean; data: T }

export interface BlockedDate {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  reason?: string
  createdAt: string
}

export interface PricingRule {
  id: string
  propertyId: string
  name?: string
  ruleType: string
  startDate: string
  endDate: string
  nightlyRate: number
  minStayNights: number
  createdAt: string
}

export const availabilityApi = {
  async getBlockedDates(propertyId: string): Promise<BlockedDate[]> {
    const res = await apiClient.get<Res<BlockedDate[]>>(`/properties/${propertyId}/blocked-dates`)
    return res.data.data
  },

  async blockDates(propertyId: string, payload: {
    startDate: string; endDate: string; reason?: string
  }): Promise<BlockedDate> {
    const res = await apiClient.post<Res<BlockedDate>>(`/properties/${propertyId}/blocked-dates`, payload)
    return res.data.data
  },

  async unblockDate(propertyId: string, blockId: string): Promise<void> {
    await apiClient.delete(`/properties/${propertyId}/blocked-dates/${blockId}`)
  },

  async getPricingRules(propertyId: string): Promise<PricingRule[]> {
    const res = await apiClient.get<Res<PricingRule[]>>(`/properties/${propertyId}/pricing-rules`)
    return res.data.data
  },

  async createPricingRule(propertyId: string, payload: {
    name?: string; startDate: string; endDate: string
    nightlyRate: number; minStayNights?: number
  }): Promise<PricingRule> {
    const res = await apiClient.post<Res<PricingRule>>(`/properties/${propertyId}/pricing-rules`, payload)
    return res.data.data
  },

  async deletePricingRule(propertyId: string, ruleId: string): Promise<void> {
    await apiClient.delete(`/properties/${propertyId}/pricing-rules/${ruleId}`)
  },
}
