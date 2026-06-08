import apiClient from './client'
import type { OnboardingState } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('AUTH')

export const onboardingApi = {
  getState: async (): Promise<OnboardingState> => {
    log.debug('onboarding.getState')
    const { data } = await apiClient.get('/onboarding/state')
    log.info('onboarding.getState — step=%s completed=%s', data.data?.step, data.data?.completed)
    return data.data
  },

  selectLock: async (oauthState: string, ttlockLockId: number, lockName?: string): Promise<OnboardingState> => {
    log.info('onboarding.selectLock — lockId=%d name=%s', ttlockLockId, lockName)
    const { data } = await apiClient.post('/onboarding/select-lock', {
      oauthState,
      ttlockLockId,
      lockName,
    })
    log.info('onboarding.selectLock — step=%s', data.data?.step)
    return data.data
  },

  complete: async (): Promise<void> => {
    log.info('onboarding.complete — marking onboarding done')
    await apiClient.post('/onboarding/complete')
    log.info('onboarding.complete — success')
  },
}
