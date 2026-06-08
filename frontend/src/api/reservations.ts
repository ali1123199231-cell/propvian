import apiClient from './client'
import type { Reservation, PageResponse } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('RESERVATION')

export const reservationsApi = {
  listByOrg: async (orgId: string, page = 0, size = 20): Promise<PageResponse<Reservation>> => {
    log.debug('listByOrg — org=%s page=%d size=%d', shortId(orgId), page, size)
    const { data } = await apiClient.get(`/organizations/${orgId}/reservations`, {
      params: { page, size }
    })
    log.debug('listByOrg — got %d items (total=%d)', data.data?.content?.length, data.data?.totalElements)
    return data.data
  },

  listByProperty: async (propertyId: string, page = 0, size = 20): Promise<PageResponse<Reservation>> => {
    log.debug('listByProperty — property=%s page=%d', shortId(propertyId), page)
    const { data } = await apiClient.get(`/properties/${propertyId}/reservations`, {
      params: { page, size }
    })
    log.debug('listByProperty — got %d items', data.data?.content?.length)
    return data.data
  },

  getById: async (id: string): Promise<Reservation> => {
    log.debug('getById — id=%s', shortId(id))
    const { data } = await apiClient.get(`/reservations/${id}`)
    log.debug('getById — status=%s', data.data?.status)
    return data.data
  },

  create: async (propertyId: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    log.info('create — property=%s checkIn=%s checkOut=%s guests=%d',
      shortId(propertyId),
      reservation.checkInDate,
      reservation.checkOutDate,
      reservation.numberOfGuests,
    )
    const { data } = await apiClient.post(`/properties/${propertyId}/reservations`, reservation)
    log.info('create — success id=%s', shortId(data.data?.id))
    return data.data
  },

  cancel: async (id: string): Promise<Reservation> => {
    log.info('cancel — id=%s', shortId(id))
    const { data } = await apiClient.post(`/reservations/${id}/cancel`)
    log.info('cancel — success status=%s', data.data?.status)
    return data.data
  },

  checkout: async (id: string): Promise<Reservation> => {
    log.info('checkout — id=%s', shortId(id))
    const { data } = await apiClient.post(`/reservations/${id}/checkout`)
    log.info('checkout — success status=%s', data.data?.status)
    return data.data
  },
}
