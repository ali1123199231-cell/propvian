import apiClient from './client'
import type { Property, PageResponse } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('PROPERTY')

export const propertiesApi = {
  create: async (orgId: string, data: Partial<Property>): Promise<Property> => {
    log.info('create — org=%s name=%s', shortId(orgId), data.name)
    const response = await apiClient.post(`/organizations/${orgId}/properties`, data)
    log.info('create — success id=%s', shortId(response.data.data?.id))
    return response.data.data
  },

  list: async (orgId: string, page = 0, size = 20): Promise<PageResponse<Property>> => {
    log.debug('list — org=%s page=%d', shortId(orgId), page)
    const { data } = await apiClient.get(`/organizations/${orgId}/properties`, {
      params: { page, size }
    })
    log.debug('list — got %d properties', data.data?.content?.length)
    return data.data
  },

  getById: async (orgId: string, propertyId: string): Promise<Property> => {
    log.debug('getById — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/organizations/${orgId}/properties/${propertyId}`)
    log.debug('getById — name=%s status=%s', data.data?.name, data.data?.status)
    return data.data
  },

  update: async (orgId: string, propertyId: string, updates: Partial<Property>): Promise<Property> => {
    log.info('update — property=%s fields=%s', shortId(propertyId), Object.keys(updates).join(','))
    const { data } = await apiClient.put(`/organizations/${orgId}/properties/${propertyId}`, updates)
    log.info('update — success')
    return data.data
  },

  delete: async (orgId: string, propertyId: string): Promise<void> => {
    log.info('delete — property=%s', shortId(propertyId))
    await apiClient.delete(`/organizations/${orgId}/properties/${propertyId}`)
    log.info('delete — success')
  },

  addPhoto: async (orgId: string, propertyId: string, data: { url: string; caption?: string; sortOrder?: number; primary?: boolean }): Promise<any> => {
    log.debug('addPhoto — property=%s primary=%s', shortId(propertyId), data.primary)
    const response = await apiClient.post(`/organizations/${orgId}/properties/${propertyId}/photos`, data)
    return response.data.data
  },

  getPhotos: async (orgId: string, propertyId: string): Promise<unknown[]> => {
    log.debug('getPhotos — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/organizations/${orgId}/properties/${propertyId}/photos`)
    log.debug('getPhotos — got %d photos', data.data?.length)
    return data.data ?? []
  },

  deletePhoto: async (orgId: string, propertyId: string, photoId: string): Promise<void> => {
    log.info('deletePhoto — property=%s photo=%s', shortId(propertyId), shortId(photoId))
    await apiClient.delete(`/organizations/${orgId}/properties/${propertyId}/photos/${photoId}`)
  },

  reorderPhotos: async (orgId: string, propertyId: string, photoIds: string[]): Promise<void> => {
    log.debug('reorderPhotos — property=%s count=%d', shortId(propertyId), photoIds.length)
    await apiClient.put(`/organizations/${orgId}/properties/${propertyId}/photos/reorder`, { photoIds })
  },
}
