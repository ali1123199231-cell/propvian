import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// How many ms before expiry to proactively refresh (2 min)
const REFRESH_BEFORE_MS = 2 * 60 * 1000
// Default access token lifetime assumed if we can't decode it (15 min)
const DEFAULT_ACCESS_TTL_MS = 15 * 60 * 1000

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Token expiry helpers ───────────────────────────────────────────────────────

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return false
  const expiry = getTokenExpiry(token)
  if (!expiry) return false
  return Date.now() >= expiry - REFRESH_BEFORE_MS
}

// ── Shared refresh state ───────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

async function doRefresh(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) throw new Error('No refresh token')

  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  const { accessToken, refreshToken: newRefreshToken } = response.data.data
  // Always store the NEW refresh token returned by the server (token rotation)
  useAuthStore.getState().setTokens(accessToken, newRefreshToken ?? refreshToken)
  return accessToken
}

// ── Request interceptor: proactively refresh if token is about to expire ───────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated && accessToken && refreshToken && isTokenExpiringSoon(accessToken)) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await doRefresh()
          processQueue(null, newToken)
          config.headers.Authorization = `Bearer ${newToken}`
        } catch (err) {
          processQueue(err, null)
          useAuthStore.getState().logout()
        } finally {
          isRefreshing = false
        }
        return config
      }
    }

    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 with reactive refresh ────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(() => Promise.reject(error))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        isRefreshing = false
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const newToken = await doRefresh()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
