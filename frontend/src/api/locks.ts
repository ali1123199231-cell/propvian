import apiClient from './client'
import type { Lock } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('LOCK')

export interface OAuthStartResponse {
  authMethod: 'oauth' | 'password'
  oauthUrl?: string
  state?: string
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
    log.info('startOAuth — initiating TTLock OAuth flow')
    const { data } = await apiClient.get('/ttlock/oauth/start')
    log.info('startOAuth — authMethod=%s', data.data?.authMethod)
    return data.data
  },

  loginWithCredentials: async (username: string, password: string): Promise<{ state: string }> => {
    log.info('loginWithCredentials — TTLock credential login (username hidden)')
    const { data } = await apiClient.post('/ttlock/oauth/login', { username, password })
    log.info('loginWithCredentials — success, state=%s', shortId(data.data?.state))
    return data.data
  },

  getOAuthLocks: async (state: string): Promise<OAuthLockItem[]> => {
    log.debug('getOAuthLocks — state=%s', shortId(state))
    const { data } = await apiClient.get(`/ttlock/oauth/locks?state=${state}`)
    log.info('getOAuthLocks — found %d locks', data.data?.length)
    return data.data
  },

  connect: async (propertyId: string, payload: {
    oauthState: string
    ttlockLockId: number
    name?: string
  }): Promise<Lock> => {
    log.info('connect — property=%s lockId=%d name=%s', shortId(propertyId), payload.ttlockLockId, payload.name)
    const response = await apiClient.post(`/properties/${propertyId}/locks`, payload)
    log.info('connect — success lockRecordId=%s', shortId(response.data.data?.id))
    return response.data.data
  },

  listByProperty: async (propertyId: string): Promise<Lock[]> => {
    log.debug('listByProperty — property=%s', shortId(propertyId))
    const { data } = await apiClient.get(`/properties/${propertyId}/locks`)
    log.debug('listByProperty — got %d locks', data.data?.length)
    return data.data
  },

  getById: async (lockId: string): Promise<Lock> => {
    log.debug('getById — lock=%s', shortId(lockId))
    const { data } = await apiClient.get(`/locks/${lockId}`)
    log.debug('getById — status=%s battery=%s', data.data?.status, data.data?.electricQuantity)
    return data.data
  },

  sync: async (lockId: string): Promise<Lock> => {
    log.info('sync — lock=%s', shortId(lockId))
    const { data } = await apiClient.post(`/locks/${lockId}/sync`)
    log.info('sync — done status=%s', data.data?.status)
    return data.data
  },

  disconnect: async (lockId: string): Promise<void> => {
    log.info('disconnect — lock=%s', shortId(lockId))
    await apiClient.delete(`/locks/${lockId}`)
    log.info('disconnect — success')
  },

  delete: async (lockId: string): Promise<void> => {
    log.info('delete — lock=%s', shortId(lockId))
    await apiClient.delete(`/locks/${lockId}/remove`)
    log.info('delete — success')
  },
}
