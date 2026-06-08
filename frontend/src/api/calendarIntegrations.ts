import apiClient from './client'
import type { CalendarIntegration } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('CALENDAR')

export const calendarIntegrationsApi = {
  create: async (propertyId: string, data: {
    platform: string
    icalUrl: string
    displayName?: string
    syncIntervalMinutes?: number
  }): Promise<CalendarIntegration> => {
    log.info('calendarIntegrations.create — property=%s platform=%s', shortId(propertyId), data.platform)
    const response = await apiClient.post(`/properties/${propertyId}/calendar-integrations`, data)
    log.info('calendarIntegrations.create — success id=%s', shortId(response.data.data?.id))
    return response.data.data
  },

  listByProperty: async (propertyId: string): Promise<CalendarIntegration[]> => {
    log.debug('calendarIntegrations.listByProperty — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar-integrations`)
    log.debug('calendarIntegrations.listByProperty — got %d integrations', data.data?.length)
    return data.data
  },

  delete: async (integrationId: string): Promise<void> => {
    log.info('calendarIntegrations.delete — id=%s', shortId(integrationId))
    await apiClient.delete(`/calendar-integrations/${integrationId}`)
    log.info('calendarIntegrations.delete — success')
  },

  sync: async (integrationId: string): Promise<void> => {
    log.info('calendarIntegrations.sync — id=%s', shortId(integrationId))
    await apiClient.post(`/calendar-integrations/${integrationId}/sync`)
    log.info('calendarIntegrations.sync — triggered')
  },

  getExportToken: async (propertyId: string): Promise<string> => {
    log.debug('calendarIntegrations.getExportToken — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/calendar-integrations/export-token`)
    log.debug('calendarIntegrations.getExportToken — token received')
    return typeof data.data === 'string' ? data.data : data.data?.token ?? data.data
  },

  rotateToken: async (propertyId: string): Promise<string> => {
    log.info('calendarIntegrations.rotateToken — property=%s', shortId(propertyId))
    const { data } = await apiClient.post(`/properties/${propertyId}/calendar-integrations/rotate-token`)
    log.info('calendarIntegrations.rotateToken — new token issued')
    return typeof data.data === 'string' ? data.data : data.data?.token ?? data.data
  },
}
