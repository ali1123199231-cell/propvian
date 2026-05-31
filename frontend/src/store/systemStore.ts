import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SystemConfig, BusinessModel } from '@/types'
import { systemConfigApi } from '@/api/systemConfig'

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

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      config: null,
      loading: false,

      fetchConfig: async () => {
        set({ loading: true })
        try {
          const config = await systemConfigApi.resolveSystemConfig()
          set({ config, loading: false })
        } catch {
          set({ config: DEFAULT_CONFIG, loading: false })
        }
      },

      businessModel: () => get().config?.businessModel ?? 'ttlock',

      isDirectBooking: () => get().config?.businessModel === 'direct_booking',
    }),
    {
      name: 'propvian-system',
      partialize: (s) => ({ config: s.config }),
    }
  )
)
