import apiClient from './client'
import type { OnboardingState } from '@/types'

export const onboardingApi = {
  getState: async (): Promise<OnboardingState> => {
    const { data } = await apiClient.get('/onboarding/state')
    return data.data
  },

  selectLock: async (oauthState: string, ttlockLockId: number, lockName?: string): Promise<OnboardingState> => {
    const { data } = await apiClient.post('/onboarding/select-lock', {
      oauthState,
      ttlockLockId,
      lockName,
    })
    return data.data
  },

  complete: async (): Promise<void> => {
    await apiClient.post('/onboarding/complete')
  },
}
