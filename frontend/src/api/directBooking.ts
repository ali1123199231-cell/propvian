import { apiClient } from './client'
import type { DirectBooking, PageResponse } from '@/types'
import { logger, shortId, maskEmail, maskName, maskPhone } from '@/lib/logger'

type Res<T> = { success: boolean; data: T }

const log = logger.child('GUEST')

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
    log.info('create — org=%s property=%s %s→%s guests=%d guestEmail=%s',
      shortId(orgId),
      shortId(payload.propertyId),
      payload.checkInDate,
      payload.checkOutDate,
      payload.numberOfGuests,
      maskEmail(payload.guestEmail),
    )
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings`, payload)
    log.info('create — success id=%s status=%s', shortId(res.data.data?.id), res.data.data?.status)
    return res.data.data
  },

  async list(orgId: string, page = 0, size = 20): Promise<PageResponse<DirectBooking>> {
    log.debug('list — org=%s page=%d size=%d', shortId(orgId), page, size)
    const res = await apiClient.get<Res<PageResponse<DirectBooking>>>(
      `/organizations/${orgId}/direct-bookings`, { params: { page, size } })
    log.debug('list — got %d bookings (total=%d)', res.data.data?.content?.length, res.data.data?.totalElements)
    return res.data.data
  },

  async get(orgId: string, bookingId: string): Promise<DirectBooking> {
    log.debug('get — booking=%s', shortId(bookingId))
    const res = await apiClient.get<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}`)
    log.debug('get — status=%s', res.data.data?.status)
    return res.data.data
  },

  async confirm(orgId: string, bookingId: string): Promise<DirectBooking> {
    log.info('confirm — booking=%s', shortId(bookingId))
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}/confirm`)
    log.info('confirm — success status=%s', res.data.data?.status)
    return res.data.data
  },

  async cancel(orgId: string, bookingId: string, reason?: string): Promise<DirectBooking> {
    log.info('cancel — booking=%s reason=%s', shortId(bookingId), reason)
    const res = await apiClient.post<Res<DirectBooking>>(
      `/organizations/${orgId}/direct-bookings/${bookingId}/cancel`,
      null,
      { params: { reason } })
    log.info('cancel — success status=%s', res.data.data?.status)
    return res.data.data
  },

  async getUnavailableDates(orgId: string, propertyId: string): Promise<string[]> {
    log.debug('getUnavailableDates — org=%s property=%s', shortId(orgId), shortId(propertyId))
    const res = await apiClient.get<Res<string[]>>(
      `/organizations/${orgId}/direct-bookings/unavailable-dates`,
      { params: { propertyId } })
    log.debug('getUnavailableDates — got %d blocked dates', res.data.data?.length)
    return res.data.data
  },
}
