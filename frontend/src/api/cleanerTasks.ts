import apiClient from './client'
import type { CleanerTask, PageResponse } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const cleanerTasksApi = {
  listByOrg: async (orgId: string, page = 0, size = 20): Promise<PageResponse<CleanerTask>> => {
    log.debug('cleanerTasks.listByOrg — org=%s page=%d', shortId(orgId), page)
    const { data } = await apiClient.get(`/organizations/${orgId}/cleaner-tasks`, {
      params: { page, size },
    })
    log.debug('cleanerTasks.listByOrg — got %d of %d', data.data?.content?.length, data.data?.totalElements)
    return data.data
  },

  updateStatus: async (taskId: string, status: string): Promise<CleanerTask> => {
    log.info('cleanerTasks.updateStatus — task=%s status=%s', shortId(taskId), status)
    const { data } = await apiClient.patch(`/cleaner-tasks/${taskId}/status`, null, {
      params: { status },
    })
    log.info('cleanerTasks.updateStatus — success')
    return data.data
  },
}
