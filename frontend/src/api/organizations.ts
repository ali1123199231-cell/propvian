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
}
