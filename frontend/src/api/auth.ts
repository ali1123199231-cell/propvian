import apiClient from './client'
import type { AuthResponse } from '@/types'
import { logger, maskEmail } from '@/lib/logger'

const log = logger.child('AUTH')

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    log.info('login — email=%s', maskEmail(email))
    const { data } = await apiClient.post('/auth/login', { email, password })
    log.info('login — success userId=%s', data.data?.user?.id)
    return data.data
  },

  register: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthResponse> => {
    log.info('register — email=%s', maskEmail(email))
    const { data } = await apiClient.post('/auth/register', { email, password, firstName, lastName })
    log.info('register — success userId=%s step=%s', data.data?.user?.id, data.data?.user?.onboardingStep)
    return data.data
  },

  verifyEmail: async (code: string): Promise<AuthResponse> => {
    log.info('verifyEmail — submitting code (length=%d)', code.length)
    const { data } = await apiClient.post('/auth/verify-email', { code })
    log.info('verifyEmail — success step=%s', data.data?.user?.onboardingStep)
    return data.data
  },

  resendVerification: async (): Promise<void> => {
    log.info('resendVerification — requesting new code')
    await apiClient.post('/auth/resend-verification')
    log.info('resendVerification — sent')
  },

  logout: async (): Promise<void> => {
    log.info('logout — calling API')
    await apiClient.post('/auth/logout').catch((err) => {
      log.warn('logout — API call failed (will still clear local state)', err?.message)
    })
    log.info('logout — done')
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    log.debug('refreshToken — requesting new tokens')
    const { data } = await apiClient.post('/auth/refresh', { refreshToken })
    log.debug('refreshToken — success')
    return data.data
  },

  forgotPassword: async (email: string): Promise<void> => {
    log.info('forgotPassword — email=%s', maskEmail(email))
    await apiClient.post('/auth/forgot-password', { email })
    log.info('forgotPassword — request sent')
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    log.info('resetPassword — submitting new password (tokenLen=%d)', token.length)
    await apiClient.post('/auth/reset-password', { token, newPassword })
    log.info('resetPassword — success')
  },
}
