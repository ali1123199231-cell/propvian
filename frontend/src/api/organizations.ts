import apiClient from './client'
import type { Organization } from '@/types'

export const organizationsApi = {
  create: async (name: string, timezone?: string): Promise<Organization> => {
    const { data } = await apiClient.post('/organizations', { name, timezone })
    return data.data
  },

  getById: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.get(`/organizations/${id}`)
    return data.data
  },

  getMy: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get('/organizations/my')
    return data.data
  },

  update: async (id: string, payload: { name?: string; timezone?: string; country?: string; website?: string }): Promise<Organization> => {
    const { data } = await apiClient.put(`/organizations/${id}`, payload)
    return data.data
  },

  updateSlug: async (id: string, slug: string): Promise<Organization> => {
    const { data } = await apiClient.put(`/organizations/${id}/slug`, { slug })
    return data.data
  },

  checkSlug: async (slug: string): Promise<{ available: boolean; slug: string }> => {
    const { data } = await apiClient.get(`/organizations/public/check-slug/${encodeURIComponent(slug)}`)
    return data.data
  },
}
