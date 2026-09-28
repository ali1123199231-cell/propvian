import apiClient from './client'
import type { User } from '@/types'
import { logger } from '@/lib/logger'

const log = logger.child('USERS')

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  locale?: string
}

export const usersApi = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/users/me')
    return data.data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    log.info('updateProfile — fields=%s', Object.keys(payload).join(','))
    const { data } = await apiClient.put('/users/me', payload)
    return data.data
  },

  /**
   * Persists the host's language so their transactional email matches the
   * dashboard they chose it in. Failures are swallowed: the UI language has
   * already changed locally, and a lost preference is not worth an error toast.
   */
  setLocale: async (locale: string): Promise<void> => {
    try {
      await apiClient.put('/users/me', { locale })
      log.info('setLocale — saved %s', locale)
    } catch (e) {
      log.warn('setLocale — could not persist: %s', (e as Error)?.message)
    }
  },
}
