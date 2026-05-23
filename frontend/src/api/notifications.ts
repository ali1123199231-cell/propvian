import apiClient from './client'
import type { Notification, PageResponse } from '@/types'

export const notificationsApi = {
  list: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    const { data } = await apiClient.get('/notifications', { params: { page, size } })
    return data.data
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data.data.count
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all')
  },
}
