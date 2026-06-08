import apiClient from './client'
import type { CalendarIntegration } from '@/types'

export const calendarIntegrationsApi = {
  create: async (propertyId: string, data: {
    platform: string
    icalUrl: string
    displayName?: string
    syncIntervalMinutes?: number
  }): Promise<CalendarIntegration> => {
    const response = await apiClient.post(`/properties/${propertyId}/calendar-integrations`, data)
    return response.data.data
  },

  listByProperty: async (propertyId: string): Promise<CalendarIntegration[]> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar-integrations`)
    return data.data
  },

  delete: async (integrationId: string): Promise<void> => {
    await apiClient.delete(`/calendar-integrations/${integrationId}`)
  },

  sync: async (integrationId: string): Promise<void> => {
    await apiClient.post(`/calendar-integrations/${integrationId}/sync`)
  },

  getExportToken: async (propertyId: string): Promise<string> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar-integrations/export-token`)
    return typeof data.data === 'string' ? data.data : data.data?.token ?? data.data
  },

  rotateToken: async (propertyId: string): Promise<string> => {
    const { data } = await apiClient.post(`/properties/${propertyId}/calendar-integrations/rotate-token`)
    return typeof data.data === 'string' ? data.data : data.data?.token ?? data.data
  },
}
