import apiClient from './client'
import type { CleanerTask, PageResponse } from '@/types'

export const cleanerTasksApi = {
  listByOrg: async (orgId: string, page = 0, size = 20): Promise<PageResponse<CleanerTask>> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/cleaner-tasks`, {
      params: { page, size },
    })
    return data.data
  },

  updateStatus: async (taskId: string, status: string): Promise<CleanerTask> => {
    const { data } = await apiClient.patch(`/cleaner-tasks/${taskId}/status`, null, {
      params: { status },
    })
    return data.data
  },
}
