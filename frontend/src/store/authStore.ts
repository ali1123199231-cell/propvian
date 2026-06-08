import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organization } from '@/types'
import { logger, maskEmail, shortId } from '@/lib/logger'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  activeOrg: Organization | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setActiveOrg: (org: Organization) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

const log = logger.child('STORE')

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeOrg: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        log.info('setAuth — user authenticated', {
          userId: shortId(user.id),
          email: maskEmail(user.email),
          role: user.role,
        })
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      setTokens: (accessToken, refreshToken) => {
        log.debug('setTokens — tokens updated (hasAccess=%s, hasRefresh=%s)', !!accessToken, !!refreshToken)
        set({ accessToken, refreshToken })
      },

      setActiveOrg: (org) => {
        log.info('setActiveOrg — org=%s name=%s', shortId(org.id), org.name)
        set({ activeOrg: org })
      },

      updateUser: (updates) => {
        log.debug('updateUser — fields: %s', Object.keys(updates).join(', '))
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : state.user }))
      },

      logout: () => {
        log.info('logout — clearing auth state')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          activeOrg: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'propvian-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeOrg: state.activeOrg,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          log.info('Auth store rehydrated — user=%s org=%s',
            maskEmail(state.user?.email),
            shortId(state.activeOrg?.id),
          )
        } else {
          log.debug('Auth store rehydrated — no active session')
        }
      },
    }
  )
)
