import apiClient from './client'
import type { Organization } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('STORE')

export const organizationsApi = {
  create: async (name: string, timezone?: string): Promise<Organization> => {
    log.info('org.create — name=%s timezone=%s', name, timezone)
    const { data } = await apiClient.post('/organizations', { name, timezone })
    log.info('org.create — success id=%s', shortId(data.data?.id))
    return data.data
  },

  getById: async (id: string): Promise<Organization> => {
    log.debug('org.getById — id=%s', shortId(id))
    const { data } = await apiClient.get(`/organizations/${id}`)
    log.debug('org.getById — name=%s', data.data?.name)
    return data.data
  },

  getMy: async (): Promise<Organization[]> => {
    log.debug('org.getMy — fetching my organizations')
    const { data } = await apiClient.get('/organizations/my')
    log.debug('org.getMy — got %d orgs', data.data?.length)
    return data.data
  },

  update: async (id: string, payload: { name?: string; timezone?: string; country?: string; website?: string }): Promise<Organization> => {
    log.info('org.update — id=%s fields=%s', shortId(id), Object.keys(payload).join(','))
    const { data } = await apiClient.put(`/organizations/${id}`, payload)
    log.info('org.update — success')
    return data.data
  },

  updateSlug: async (id: string, slug: string): Promise<Organization> => {
    log.info('org.updateSlug — id=%s slug=%s', shortId(id), slug)
    const { data } = await apiClient.put(`/organizations/${id}/slug`, { slug })
    log.info('org.updateSlug — success')
    return data.data
  },

  checkSlug: async (slug: string): Promise<{ available: boolean; slug: string }> => {
    log.debug('org.checkSlug — slug=%s', slug)
    const { data } = await apiClient.get(`/organizations/public/check-slug/${encodeURIComponent(slug)}`)
    log.debug('org.checkSlug — available=%s', data.data?.available)
    return data.data
  },
}
