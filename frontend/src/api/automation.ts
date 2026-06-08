import axios from 'axios'
import client from './client'
import type { AutomationStatus, CheckinPageData } from '@/types'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const automationApi = {
  getStatus: async (orgId: string): Promise<AutomationStatus> => {
    log.debug('automation.getStatus — org=%s', shortId(orgId))
    const res = await client.get(`/organizations/${orgId}/automation`)
    log.debug('automation.getStatus — enabled=%s', res.data.data?.automationEnabled)
    return res.data.data
  },

  enable: async (orgId: string): Promise<AutomationStatus> => {
    log.info('automation.enable — org=%s', shortId(orgId))
    const res = await client.put(`/organizations/${orgId}/automation/enable`)
    log.info('automation.enable — success')
    return res.data.data
  },

  disable: async (orgId: string): Promise<AutomationStatus> => {
    log.info('automation.disable — org=%s', shortId(orgId))
    const res = await client.put(`/organizations/${orgId}/automation/disable`)
    log.info('automation.disable — success')
    return res.data.data
  },
}

export const checkinApi = {
  getPage: async (code: string): Promise<CheckinPageData> => {
    log.info('checkin.getPage — code=%s', code)
    const res = await axios.get(`/api/public/checkin/${code}`)
    log.info('checkin.getPage — loaded propertyName=%s', res.data?.propertyName)
    return res.data
  },
}
