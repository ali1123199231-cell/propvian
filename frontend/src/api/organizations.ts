import apiClient from './client'
import type { Organization, OrganizationMember } from '@/types'

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

  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/members`)
    return data.data
  },

  inviteMember: async (orgId: string, body: { email: string; role: string }): Promise<OrganizationMember> => {
    const { data } = await apiClient.post(`/organizations/${orgId}/members/invite`, body)
    return data.data
  },

  removeMember: async (orgId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/organizations/${orgId}/members/${userId}`)
  },
}
