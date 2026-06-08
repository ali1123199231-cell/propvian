import apiClient from './client'
import type { CalendarInterval, BookingHold, PropertyHouseRule, PropertySeasonalRule } from '@/types'

// ── Calendar Engine (interval-based availability) ─────────────────────────────

export const calendarEngineApi = {
  // Returns all calendar intervals in a date window (admin)
  getCalendar: async (propertyId: string, from: string, to: string): Promise<CalendarInterval[]> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar`, {
      params: { from, to }
    })
    return data.data
  },

  // Block a date range (owner)
  blockDates: async (
    propertyId: string,
    startDate: string,
    endDate: string,
    reason?: string
  ): Promise<CalendarInterval> => {
    const { data } = await apiClient.post(`/properties/${propertyId}/calendar/block`, {
      startDate, endDate, reason
    })
    return data.data
  },

  // Remove a BLOCKED interval
  unblockDates: async (propertyId: string, intervalId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/calendar/intervals/${intervalId}`)
  },

  // Check availability (authenticated)
  checkAvailability: async (
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; reason?: string }> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/availability`, {
      params: { checkIn, checkOut }
    })
    return data.data
  },
}

// ── Public API (website builder / guest-facing) ───────────────────────────────

const publicBase = '/api/public'

export const publicCalendarApi = {
  getCalendar: async (propertyId: string, from: string, to: string): Promise<CalendarInterval[]> => {
    const { data } = await apiClient.get(`${publicBase}/properties/${propertyId}/calendar`, {
      params: { from, to }
    })
    return data.data
  },

  checkAvailability: async (
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; reason?: string }> => {
    const { data } = await apiClient.get(`${publicBase}/properties/${propertyId}/availability`, {
      params: { checkIn, checkOut }
    })
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
    const { data } = await apiClient.post(`${publicBase}/properties/${propertyId}/holds`, payload)
    return data.data
  },

  releaseHold: async (holdId: string): Promise<void> => {
    await apiClient.delete(`${publicBase}/holds/${holdId}`)
  },
}

// ── House rules ───────────────────────────────────────────────────────────────

export const houseRulesApi = {
  list: async (propertyId: string): Promise<PropertyHouseRule[]> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/house-rules`)
    return data.data
  },

  upsert: async (
    propertyId: string,
    ruleKey: string,
    allowed: boolean,
    notes?: string
  ): Promise<PropertyHouseRule> => {
    const { data } = await apiClient.put(`/properties/${propertyId}/house-rules`, {
      ruleKey, allowed, notes
    })
    return data.data
  },

  delete: async (propertyId: string, ruleId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/house-rules/${ruleId}`)
  },
}

// ── Seasonal rules ────────────────────────────────────────────────────────────

export const seasonalRulesApi = {
  list: async (propertyId: string): Promise<PropertySeasonalRule[]> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/seasonal-rules`)
    return data.data
  },

  create: async (
    propertyId: string,
    rule: Omit<PropertySeasonalRule, 'id' | 'propertyId'>
  ): Promise<PropertySeasonalRule> => {
    const { data } = await apiClient.post(`/properties/${propertyId}/seasonal-rules`, rule)
    return data.data
  },

  delete: async (propertyId: string, ruleId: string): Promise<void> => {
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
    const { data } = await apiClient.get(`/properties/${propertyId}/amenities`)
    return data.data
  },

  replace: async (propertyId: string, amenities: Omit<PropertyAmenity, 'id' | 'propertyId'>[]): Promise<PropertyAmenity[]> => {
    const { data } = await apiClient.put(`/properties/${propertyId}/amenities`, amenities)
    return data.data
  },

  delete: async (propertyId: string, amenityId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/amenities/${amenityId}`)
  },
}
