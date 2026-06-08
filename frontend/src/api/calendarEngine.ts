import apiClient from './client'
import type { CalendarInterval, BookingHold, PropertyHouseRule, PropertySeasonalRule } from '@/types'
import { logger, shortId, maskEmail, maskName } from '@/lib/logger'

const log = logger.child('CALENDAR')

// ── Calendar Engine (interval-based availability) ─────────────────────────────

export const calendarEngineApi = {
  getCalendar: async (propertyId: string, from: string, to: string): Promise<CalendarInterval[]> => {
    log.debug('getCalendar — property=%s from=%s to=%s', shortId(propertyId), from, to)
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar`, {
      params: { from, to }
    })
    log.debug('getCalendar — got %d intervals', data.data?.length)
    return data.data
  },

  blockDates: async (
    propertyId: string,
    startDate: string,
    endDate: string,
    reason?: string
  ): Promise<CalendarInterval> => {
    log.info('blockDates — property=%s %s→%s reason=%s', shortId(propertyId), startDate, endDate, reason)
    const { data } = await apiClient.post(`/properties/${propertyId}/calendar/block`, {
      startDate, endDate, reason
    })
    log.info('blockDates — success intervalId=%s', shortId(data.data?.id))
    return data.data
  },

  unblockDates: async (propertyId: string, intervalId: string): Promise<void> => {
    log.info('unblockDates — property=%s interval=%s', shortId(propertyId), shortId(intervalId))
    await apiClient.delete(`/properties/${propertyId}/calendar/intervals/${intervalId}`)
    log.info('unblockDates — success')
  },

  checkAvailability: async (
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; reason?: string }> => {
    log.debug('checkAvailability — property=%s %s→%s', shortId(propertyId), checkIn, checkOut)
    const { data } = await apiClient.get(`/properties/${propertyId}/availability`, {
      params: { checkIn, checkOut }
    })
    log.info('checkAvailability — available=%s reason=%s', data.data?.available, data.data?.reason)
    return data.data
  },
}

// ── Public API (website builder / guest-facing) ───────────────────────────────

const publicBase = '/api/public'

export const publicCalendarApi = {
  getCalendar: async (propertyId: string, from: string, to: string): Promise<CalendarInterval[]> => {
    log.debug('public.getCalendar — property=%s from=%s to=%s', shortId(propertyId), from, to)
    const { data } = await apiClient.get(`${publicBase}/properties/${propertyId}/calendar`, {
      params: { from, to }
    })
    log.debug('public.getCalendar — got %d intervals', data.data?.length)
    return data.data
  },

  checkAvailability: async (
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; reason?: string }> => {
    log.debug('public.checkAvailability — property=%s %s→%s', shortId(propertyId), checkIn, checkOut)
    const { data } = await apiClient.get(`${publicBase}/properties/${propertyId}/availability`, {
      params: { checkIn, checkOut }
    })
    log.info('public.checkAvailability — available=%s', data.data?.available)
    return data.data
  },

  createHold: async (
    propertyId: string,
    payload: {
      checkIn: string
      checkOut: string
      guests: number
      guestName?: string
      guestEmail?: string
      sessionId?: string
    }
  ): Promise<BookingHold> => {
    log.info('public.createHold — property=%s %s→%s guests=%d guestEmail=%s',
      shortId(propertyId),
      payload.checkIn,
      payload.checkOut,
      payload.guests,
      maskEmail(payload.guestEmail),
    )
    const { data } = await apiClient.post(`${publicBase}/properties/${propertyId}/holds`, payload)
    log.info('public.createHold — holdId=%s expiresAt=%s', shortId(data.data?.id), data.data?.expiresAt)
    return data.data
  },

  releaseHold: async (holdId: string): Promise<void> => {
    log.info('public.releaseHold — hold=%s', shortId(holdId))
    await apiClient.delete(`${publicBase}/holds/${holdId}`)
    log.info('public.releaseHold — success')
  },
}

// ── House rules ───────────────────────────────────────────────────────────────

export const houseRulesApi = {
  list: async (propertyId: string): Promise<PropertyHouseRule[]> => {
    log.debug('houseRules.list — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/house-rules`)
    log.debug('houseRules.list — got %d rules', data.data?.length)
    return data.data
  },

  upsert: async (
    propertyId: string,
    ruleKey: string,
    allowed: boolean,
    notes?: string
  ): Promise<PropertyHouseRule> => {
    log.info('houseRules.upsert — property=%s rule=%s allowed=%s', shortId(propertyId), ruleKey, allowed)
    const { data } = await apiClient.put(`/properties/${propertyId}/house-rules`, {
      ruleKey, allowed, notes
    })
    return data.data
  },

  delete: async (propertyId: string, ruleId: string): Promise<void> => {
    log.info('houseRules.delete — property=%s rule=%s', shortId(propertyId), shortId(ruleId))
    await apiClient.delete(`/properties/${propertyId}/house-rules/${ruleId}`)
  },
}

// ── Seasonal rules ────────────────────────────────────────────────────────────

export const seasonalRulesApi = {
  list: async (propertyId: string): Promise<PropertySeasonalRule[]> => {
    log.debug('seasonalRules.list — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/seasonal-rules`)
    log.debug('seasonalRules.list — got %d rules', data.data?.length)
    return data.data
  },

  create: async (
    propertyId: string,
    rule: Omit<PropertySeasonalRule, 'id' | 'propertyId'>
  ): Promise<PropertySeasonalRule> => {
    log.info('seasonalRules.create — property=%s name=%s %s→%s',
      shortId(propertyId), rule.name, rule.startDate, rule.endDate)
    const { data } = await apiClient.post(`/properties/${propertyId}/seasonal-rules`, rule)
    log.info('seasonalRules.create — success id=%s', shortId(data.data?.id))
    return data.data
  },

  delete: async (propertyId: string, ruleId: string): Promise<void> => {
    log.info('seasonalRules.delete — property=%s rule=%s', shortId(propertyId), shortId(ruleId))
    await apiClient.delete(`/properties/${propertyId}/seasonal-rules/${ruleId}`)
  },
}

// ── Amenities ─────────────────────────────────────────────────────────────────

export interface PropertyAmenity {
  id?: string
  propertyId?: string
  category: string
  name: string
  icon?: string
}

export const amenitiesApi = {
  list: async (propertyId: string): Promise<PropertyAmenity[]> => {
    log.debug('amenities.list — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/amenities`)
    log.debug('amenities.list — got %d amenities', data.data?.length)
    return data.data
  },

  replace: async (propertyId: string, amenities: Omit<PropertyAmenity, 'id' | 'propertyId'>[]): Promise<PropertyAmenity[]> => {
    log.info('amenities.replace — property=%s count=%d', shortId(propertyId), amenities.length)
    const { data } = await apiClient.put(`/properties/${propertyId}/amenities`, amenities)
    log.info('amenities.replace — success')
    return data.data
  },

  delete: async (propertyId: string, amenityId: string): Promise<void> => {
    log.info('amenities.delete — property=%s amenity=%s', shortId(propertyId), shortId(amenityId))
    await apiClient.delete(`/properties/${propertyId}/amenities/${amenityId}`)
  },
}
