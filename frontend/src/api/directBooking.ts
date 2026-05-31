import { apiClient } from './client'
import type { DirectBooking, PageResponse } from '@/types'

type Res<T> = { success: boolean; data: T }

export const directBookingApi = {
  async create(orgId: string, payload: {
    propertyId: string
    guestName: string
    guestEmail: string
    guestPhone?: string
    numberOfGuests: number
    checkInDate: string
    checkOutDate: string
    totalAmount?: number
    currency?: string
    notes?: string
  }): Promise<DirectBooking> {
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings`, payload)
    return res.data.data
  },

  async list(orgId: string, page = 0, size = 20): Promise<PageResponse<DirectBooking>> {
    const res = await apiClient.get<Res<PageResponse<DirectBooking>>>(
      `/organizations/${orgId}/direct-bookings`, { params: { page, size } })
    return res.data.data
  },

  async get(orgId: string, bookingId: string): Promise<DirectBooking> {
    const res = await apiClient.get<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}`)
    return res.data.data
  },

  async confirm(orgId: string, bookingId: string): Promise<DirectBooking> {
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}/confirm`)
    return res.data.data
  },

  async cancel(orgId: string, bookingId: string, reason?: string): Promise<DirectBooking> {
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}/cancel`,
      null,
      { params: { reason } })
    return res.data.data
  },

  async getUnavailableDates(orgId: string, propertyId: string): Promise<string[]> {
    const res = await apiClient.get<Res<string[]>>(
      `/organizations/${orgId}/direct-bookings/unavailable-dates`,
      { params: { propertyId } })
    return res.data.data
  },
}
