import axios from 'axios'
import apiClient from './client'
import type {
  GuestPage, GuestPageUpdate, GuestPageSummary, GuestPageStats,
  PublicGuestPage, GuestPageEventType, TapCodeBatch,
} from '@/types/guestPage'
import { logger, shortId } from '@/lib/logger'

const log = logger.child('GUEST_PAGE')

export const guestPagesApi = {
  list: async (orgId: string): Promise<GuestPageSummary[]> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/guest-pages`)
    log.debug('list — %d properties', data.data?.length)
    return data.data
  },

  /** Creates a prefilled page on first open. */
  get: async (orgId: string, propertyId: string): Promise<GuestPage> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/properties/${propertyId}/guest-page`)
    return data.data
  },

  update: async (orgId: string, propertyId: string, body: GuestPageUpdate): Promise<GuestPage> => {
    log.info('update — property=%s', shortId(propertyId))
    const { data } = await apiClient.put(`/organizations/${orgId}/properties/${propertyId}/guest-page`, body)
    return data.data
  },

  stats: async (orgId: string, propertyId: string, days = 30): Promise<GuestPageStats> => {
    const { data } = await apiClient.get(`/organizations/${orgId}/properties/${propertyId}/guest-page/stats`, { params: { days } })
    return data.data
  },

  claim: async (orgId: string, code: string, propertyId: string): Promise<GuestPage> => {
    log.info('claim — code=%s property=%s', code, shortId(propertyId))
    const { data } = await apiClient.post(`/organizations/${orgId}/tap-codes/${encodeURIComponent(code)}/claim`, { propertyId })
    return data.data
  },
}

export const publicGuestPageApi = {
  /** source: 'n' (NFC tag), 'q' (printed QR), 'p' (host preview, not counted) */
  get: async (code: string, source?: string): Promise<PublicGuestPage> => {
    const { data } = await axios.get(`/api/public/guest-pages/${encodeURIComponent(code)}`, {
      params: source ? { s: source } : undefined,
    })
    return data.data
  },

  /** Fire-and-forget: a failed stats ping must never disturb the guest. */
  event: (code: string, type: GuestPageEventType): void => {
    axios.post(`/api/public/guest-pages/${encodeURIComponent(code)}/events`, { type }).catch(() => {})
  },
}

export const adminTapCodesApi = {
  batches: async (): Promise<TapCodeBatch[]> => {
    const { data } = await apiClient.get('/admin/tap-codes/batches')
    return data.data
  },

  generate: async (count: number, batchLabel: string): Promise<TapCodeBatch> => {
    log.info('generate batch — label=%s count=%d', batchLabel, count)
    const { data } = await apiClient.post('/admin/tap-codes/batches', { count, batchLabel })
    return data.data
  },

  batch: async (batchLabel: string): Promise<TapCodeBatch> => {
    const { data } = await apiClient.get(`/admin/tap-codes/batches/${encodeURIComponent(batchLabel)}`)
    return data.data
  },
}
