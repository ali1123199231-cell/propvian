import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { logger, maskEmail } from '@/lib/logger'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// How many ms before expiry to proactively refresh (2 min)
const REFRESH_BEFORE_MS = 2 * 60 * 1000
// Default access token lifetime assumed if we can't decode it (15 min)
const DEFAULT_ACCESS_TTL_MS = 15 * 60 * 1000

const log = logger.child('API')

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
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

async function doRefresh(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) throw new Error('No refresh token')

  log.debug('Token refresh — sending request')
  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  const { accessToken, refreshToken: newRefreshToken } = response.data.data
  useAuthStore.getState().setTokens(accessToken, newRefreshToken ?? refreshToken)
  log.info('Token refresh — success, new token issued')
  return accessToken
}

// ── Sensitive paths — only log method+url, never body ────────────────────────

const SENSITIVE_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/refresh']

function isSensitivePath(url: string): boolean {
  return SENSITIVE_PATHS.some(p => url.includes(p))
}

function sanitizeBody(url: string, body: unknown): unknown {
  if (!body || isSensitivePath(url)) return '[redacted]'
  if (typeof body !== 'object') return body
  // Redact any field that looks like a password or token
  const redacted = { ...(body as Record<string, unknown>) }
  for (const key of Object.keys(redacted)) {
    const lower = key.toLowerCase()
    if (lower.includes('password') || lower.includes('token') || lower.includes('secret')) {
      redacted[key] = '[redacted]'
    }
    if (lower === 'email' && typeof redacted[key] === 'string') {
      redacted[key] = maskEmail(redacted[key] as string)
    }
  }
  return redacted
}

// ── Request interceptor: proactively refresh + log ────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()

    if (isAuthenticated && accessToken && refreshToken && isTokenExpiringSoon(accessToken)) {
      if (!isRefreshing) {
        isRefreshing = true
        log.info('Proactive token refresh triggered before request')
        try {
          const newToken = await doRefresh()
          processQueue(null, newToken)
          config.headers.Authorization = `Bearer ${newToken}`
        } catch (err) {
          log.warn('Proactive token refresh failed — logging out', err)
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

    // FormData: browser must set Content-Type (includes boundary); remove any default.
    // Must use AxiosHeaders.delete() — the JS `delete` operator silently fails on
    // AxiosHeaders property descriptors (works in Chrome which auto-overrides, breaks Firefox).
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type')
      log.debug('FormData upload — Content-Type header removed, browser will set boundary')
    }

    const method = (config.method ?? 'GET').toUpperCase()
    const url = config.url ?? ''
    const hasBody = !!config.data

    if (hasBody && !isSensitivePath(url)) {
      log.debug(`→ ${method} ${url}`, sanitizeBody(url, config.data))
    } else {
      log.debug(`→ ${method} ${url}`)
    }

    // Stamp request start time for response duration logging
    ;(config as unknown as Record<string, unknown>)._startMs = Date.now()

    return config
  },
  (error) => {
    log.error('Request setup error', error)
    return Promise.reject(error)
  },
)

// ── Response interceptor: log + handle 401 reactive refresh ──────────────────

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { _startMs?: number }
    const method = (config.method ?? 'GET').toUpperCase()
    const url = config.url ?? ''
    const elapsed = config._startMs ? `${Date.now() - config._startMs}ms` : '?ms'
    log.debug(`← ${method} ${url} ${response.status} (${elapsed})`)
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _startMs?: number }
    const method = (originalRequest?.method ?? 'GET').toUpperCase()
    const url = originalRequest?.url ?? ''
    const status = error.response?.status
    const elapsed = originalRequest?._startMs ? `${Date.now() - originalRequest._startMs}ms` : '?ms'

    if (status === 401 && !originalRequest._retry) {
      // Don't retry the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        log.warn(`← ${method} ${url} 401 (${elapsed}) — refresh endpoint failed, logging out`)
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        log.debug(`← ${method} ${url} 401 — queued for token refresh`)
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
        log.warn(`← ${method} ${url} 401 — no refresh token, logging out`)
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      log.info(`← ${method} ${url} 401 (${elapsed}) — attempting reactive token refresh`)

      try {
        const newToken = await doRefresh()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        log.warn('Reactive token refresh failed — logging out')
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const errData = error.response?.data
    if (status && status >= 500) {
      log.error(`← ${method} ${url} ${status} (${elapsed}) — server error`, errData)
    } else if (status && status >= 400) {
      log.warn(`← ${method} ${url} ${status} (${elapsed})`, errData)
    } else {
      log.error(`← ${method} ${url} network error (${elapsed})`, error.message)
    }

    return Promise.reject(error)
  },
)

export default apiClient
