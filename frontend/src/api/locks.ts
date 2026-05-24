import apiClient from './client'
import type { Lock } from '@/types'

export interface OAuthStartResponse {
  oauthUrl: string
  state: string
}

export interface OAuthLockItem {
  lockId: number
  lockAlias: string
  lockName: string
  electricQuantity: number | null
  featureValue: string | null
}

export const locksApi = {
  startOAuth: async (): Promise<OAuthStartResponse> => {
    const { data } = await apiClient.get('/ttlock/oauth/start')
    return data.data
  },

  getOAuthLocks: async (state: string): Promise<OAuthLockItem[]> => {
    const { data } = await apiClient.get(`/ttlock/oauth/locks?state=${state}`)
    return data.data
  },

  connect: async (propertyId: string, data: {
    oauthState: string
    ttlockLockId: number
    name?: string
  }): Promise<Lock> => {
    const response = await apiClient.post(`/properties/${propertyId}/locks`, data)
    return response.data.data
  },

  listByProperty: async (propertyId: string): Promise<Lock[]> => {
    const { data } = await apiClient.get(`/properties/${propertyId}/locks`)
    return data.data
  },

  getById: async (lockId: string): Promise<Lock> => {
    const { data } = await apiClient.get(`/locks/${lockId}`)
    return data.data
  },

  sync: async (lockId: string): Promise<Lock> => {
    const { data } = await apiClient.post(`/locks/${lockId}/sync`)
    return data.data
  },

  disconnect: async (lockId: string): Promise<void> => {
    await apiClient.delete(`/locks/${lockId}`)
  },

  delete: async (lockId: string): Promise<void> => {
    await apiClient.delete(`/locks/${lockId}/remove`)
  },
}
