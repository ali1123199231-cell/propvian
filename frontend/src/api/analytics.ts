import apiClient from './client'
import type { DashboardStats } from '@/types'

export const analyticsApi = {
  getDashboardStats: async (orgId: string): Promise<DashboardStats> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/analytics/dashboard`)
    return data.data
  },
}
