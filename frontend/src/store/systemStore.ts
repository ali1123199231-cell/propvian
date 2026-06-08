import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SystemConfig, BusinessModel } from '@/types'
import { systemConfigApi } from '@/api/systemConfig'
import { logger } from '@/lib/logger'

interface SystemState {
  config: SystemConfig | null
  loading: boolean
  fetchConfig: () => Promise<void>
  businessModel: () => BusinessModel
  isDirectBooking: () => boolean
}

const DEFAULT_CONFIG: SystemConfig = {
  businessModel: 'ttlock',
  verificationSteps: {
    identityEnabled: true,
    propertyEnabled: true,
    otaEnabled: true,
    calendarEnabled: true,
    paymentEnabled: true,
    domainEnabled: true,
    adminApprovalEnabled: true,
  },
}

const log = logger.child('SYSTEM')

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      config: null,
      loading: false,

      fetchConfig: async () => {
        log.debug('fetchConfig — loading system config')
        set({ loading: true })
        try {
          const config = await systemConfigApi.resolveSystemConfig()
          log.info('fetchConfig — loaded businessModel=%s', config.businessModel)
          set({ config, loading: false })
        } catch (err) {
          log.warn('fetchConfig — failed, using DEFAULT_CONFIG', err)
          set({ config: DEFAULT_CONFIG, loading: false })
        }
      },

      businessModel: () => {
        const model = get().config?.businessModel ?? 'ttlock'
        log.debug('businessModel → %s', model)
        return model
      },

      isDirectBooking: () => get().config?.businessModel === 'direct_booking',
    }),
    {
      name: 'propvian-system',
      partialize: (s) => ({ config: s.config }),
      onRehydrateStorage: () => (state) => {
        log.debug('System store rehydrated — businessModel=%s', state?.config?.businessModel ?? 'none')
      },
    }
  )
)
