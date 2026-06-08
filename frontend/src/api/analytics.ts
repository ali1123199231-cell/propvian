import apiClient from './client'
import type { DashboardStats } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const analyticsApi = {
  getDashboardStats: async (orgId: string): Promise<DashboardStats> => {
    log.debug('analytics.getDashboardStats — org=%s', shortId(orgId))
    const { data } = await apiClient.get(`/organizations/${orgId}/analytics/dashboard`)
    log.debug('analytics.getDashboardStats — received stats')
    return data.data
  },
}
