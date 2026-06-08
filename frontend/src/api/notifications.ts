import apiClient from './client'
import type { Notification, PageResponse } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const notificationsApi = {
  list: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    log.debug('notifications.list — page=%d size=%d', page, size)
    const { data } = await apiClient.get('/notifications', { params: { page, size } })
    log.debug('notifications.list — got %d (total=%d)', data.data?.content?.length, data.data?.totalElements)
    return data.data
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count')
    log.debug('notifications.unreadCount = %d', data.data?.count)
    return data.data.count
  },

  markRead: async (id: string): Promise<void> => {
    log.debug('notifications.markRead — id=%s', shortId(id))
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    log.info('notifications.markAllRead')
    await apiClient.put('/notifications/read-all')
  },
}
