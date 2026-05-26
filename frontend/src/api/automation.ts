import axios from 'axios'
import client from './client'
import type { AutomationStatus, CheckinPageData } from '@/types'

export const automationApi = {
  getStatus: async (orgId: string): Promise<AutomationStatus> => {
    const res = await client.get(`/organizations/${orgId}/automation`)
    return res.data.data
  },

  enable: async (orgId: string): Promise<AutomationStatus> => {
    const res = await client.put(`/organizations/${orgId}/automation/enable`)
    return res.data.data
  },

  disable: async (orgId: string): Promise<AutomationStatus> => {
    const res = await client.put(`/organizations/${orgId}/automation/disable`)
    return res.data.data
  },
}

export const checkinApi = {
  getPage: async (code: string): Promise<CheckinPageData> => {
    const res = await axios.get(`/api/public/checkin/${code}`)
    return res.data
  },
}
