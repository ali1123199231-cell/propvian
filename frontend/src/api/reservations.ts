import apiClient from './client'
import type { Reservation, PageResponse } from '@/types'

export const reservationsApi = {
  listByOrg: async (orgId: string, page = 0, size = 20): Promise<PageResponse<Reservation>> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/reservations`, {
      params: { page, size }
    })
    return data.data
  },

  listByProperty: async (propertyId: string, page = 0, size = 20): Promise<PageResponse<Reservation>> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/reservations`, {
      params: { page, size }
    })
    return data.data
  },

  getById: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${id}`)
    return data.data
  },

  create: async (propertyId: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await apiClient.post(`/properties/${propertyId}/reservations`, reservation)
    return data.data
  },

  cancel: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/cancel`)
    return data.data
  },

  checkout: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/checkout`)
    return data.data
  },
}
