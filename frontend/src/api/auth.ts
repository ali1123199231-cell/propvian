import apiClient from './client'
import type { AuthResponse } from '@/types'

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    return data.data
  },

  register: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', { email, password, firstName, lastName })
    return data.data
  },

  verifyEmail: async (code: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/verify-email', { code })
    return data.data
  },

  resendVerification: async (): Promise<void> => {
    await apiClient.post('/auth/resend-verification')
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout').catch(() => {})
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken })
    return data.data
  },
}
