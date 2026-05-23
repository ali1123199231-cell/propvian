import apiClient from './client'
import type { Property, PageResponse } from '@/types'

export const propertiesApi = {
  create: async (orgId: string, data: Partial<Property>): Promise<Property> => {
    const response = await apiClient.post(`/organizations/${orgId}/properties`, data)
    return response.data.data
  },

  list: async (orgId: string, page = 0, size = 20): Promise<PageResponse<Property>> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/properties`, {
      params: { page, size }
    })
    return data.data
  },

  getById: async (orgId: string, propertyId: string): Promise<Property> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/properties/${propertyId}`)
    return data.data
  },

  update: async (orgId: string, propertyId: string, updates: Partial<Property>): Promise<Property> => {
    const { data } = await apiClient.put(`/organizations/${orgId}/properties/${propertyId}`, updates)
    return data.data
  },

  delete: async (orgId: string, propertyId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/properties/${propertyId}`)
  },
}
