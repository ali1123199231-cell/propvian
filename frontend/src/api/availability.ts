import { apiClient } from './client'
import { logger, shortId } from '@/lib/logger'

type Res<T> = { success: boolean; data: T }

const log = logger.child('CALENDAR')

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
    log.debug('blockedDates.list — property=%s', shortId(propertyId))
    const res = await apiClient.get<Res<BlockedDate[]>>(`/properties/${propertyId}/blocked-dates`)
    log.debug('blockedDates.list — got %d dates', res.data.data?.length)
    return res.data.data
  },

  async blockDates(propertyId: string, payload: {
    startDate: string; endDate: string; reason?: string
  }): Promise<BlockedDate> {
    log.info('blockDates — property=%s %s→%s reason=%s',
      shortId(propertyId), payload.startDate, payload.endDate, payload.reason)
    const res = await apiClient.post<Res<BlockedDate>>(`/properties/${propertyId}/blocked-dates`, payload)
    log.info('blockDates — success id=%s', shortId(res.data.data?.id))
    return res.data.data
  },

  async unblockDate(propertyId: string, blockId: string): Promise<void> {
    log.info('unblockDate — property=%s block=%s', shortId(propertyId), shortId(blockId))
    await apiClient.delete(`/properties/${propertyId}/blocked-dates/${blockId}`)
    log.info('unblockDate — success')
  },

  async getPricingRules(propertyId: string): Promise<PricingRule[]> {
    log.debug('pricingRules.list — property=%s', shortId(propertyId))
    const res = await apiClient.get<Res<PricingRule[]>>(`/properties/${propertyId}/pricing-rules`)
    log.debug('pricingRules.list — got %d rules', res.data.data?.length)
    return res.data.data
  },

  async createPricingRule(propertyId: string, payload: {
    name?: string; startDate: string; endDate: string
    nightlyRate: number; minStayNights?: number
  }): Promise<PricingRule> {
    log.info('pricingRules.create — property=%s name=%s %s→%s rate=%d',
      shortId(propertyId), payload.name, payload.startDate, payload.endDate, payload.nightlyRate)
    const res = await apiClient.post<Res<PricingRule>>(`/properties/${propertyId}/pricing-rules`, payload)
    log.info('pricingRules.create — success id=%s', shortId(res.data.data?.id))
    return res.data.data
  },

  async deletePricingRule(propertyId: string, ruleId: string): Promise<void> {
    log.info('pricingRules.delete — property=%s rule=%s', shortId(propertyId), shortId(ruleId))
    await apiClient.delete(`/properties/${propertyId}/pricing-rules/${ruleId}`)
    log.info('pricingRules.delete — success')
  },
}
