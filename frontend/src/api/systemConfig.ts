import { apiClient } from './client'
import type { SystemConfig } from '@/types'
import { logger } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const systemConfigApi = {
  async getBusinessModel(): Promise<string> {
    log.debug('systemConfig.getBusinessModel')
    const res = await apiClient.get<{ success: boolean; data: string }>('/system/business-model')
    log.debug('systemConfig.getBusinessModel — model=%s', res.data.data)
    return res.data.data
  },

  async getConfig(): Promise<Record<string, string>> {
    log.debug('systemConfig.getConfig')
    const res = await apiClient.get<{ success: boolean; data: Record<string, string> }>('/system/public-config')
    log.debug('systemConfig.getConfig — got %d keys', Object.keys(res.data.data).length)
    return res.data.data
  },

  async setConfig(updates: Record<string, string>): Promise<void> {
    log.info('systemConfig.setConfig — keys=%s', Object.keys(updates).join(','))
    await apiClient.put('/system/config', updates)
    log.info('systemConfig.setConfig — success')
  },

  async resolveSystemConfig(): Promise<SystemConfig> {
    log.debug('systemConfig.resolveSystemConfig')
    const raw = await this.getConfig()
    const config: SystemConfig = {
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
    log.info('systemConfig.resolveSystemConfig — businessModel=%s', config.businessModel)
    return config
  },
}
