import { apiClient } from './client'
import type { SystemConfig } from '@/types'

export const systemConfigApi = {
  async getBusinessModel(): Promise<string> {
    const res = await apiClient.get<{ success: boolean; data: string }>('/system/business-model')
    return res.data.data
  },

  async getConfig(): Promise<Record<string, string>> {
    const res = await apiClient.get<{ success: boolean; data: Record<string, string> }>('/system/config')
    return res.data.data
  },

  async setConfig(updates: Record<string, string>): Promise<void> {
    await apiClient.put('/system/config', updates)
  },

  async resolveSystemConfig(): Promise<SystemConfig> {
    const raw = await this.getConfig()
    return {
      businessModel: (raw['platform.business_model'] ?? 'ttlock') as SystemConfig['businessModel'],
      verificationSteps: {
        identityEnabled:        raw['verification.identity_check.enabled']  !== 'false',
        propertyEnabled:        raw['verification.property_check.enabled']  !== 'false',
        otaEnabled:             raw['verification.ota_check.enabled']       !== 'false',
        calendarEnabled:        raw['verification.calendar_sync.enabled']   !== 'false',
        paymentEnabled:         raw['verification.payment_setup.enabled']   !== 'false',
        domainEnabled:          raw['verification.domain_setup.enabled']    !== 'false',
        adminApprovalEnabled:   raw['verification.admin_approval.enabled']  !== 'false',
      },
    }
  },
}
