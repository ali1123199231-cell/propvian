import { apiClient } from './client'
import type { VerificationProgress } from '@/types'

type Res<T> = { success: boolean; data: T }

export const verificationApi = {
  async getStatus(orgId: string): Promise<VerificationProgress> {
    const res = await apiClient.get<Res<VerificationProgress>>(`/organizations/${orgId}/verification`)
    return res.data.data
  },

  async submitIdentity(orgId: string, payload: { identityDocumentUrl: string; selfieUrl: string }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/identity`, payload)
    return res.data.data
  },

  async submitProperty(orgId: string, payload: {
    propertyAddressLine: string
    ownershipProofUrl?: string
    managementAuthUrl?: string
    utilityBillUrl?: string
  }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/property`, payload)
    return res.data.data
  },

  async submitOta(orgId: string, payload: {
    airbnbListingUrl?: string
    bookingListingUrl?: string
    vrboListingUrl?: string
    otherListingUrls?: string[]
  }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/ota`, payload)
    return res.data.data
  },

  async connectCalendar(orgId: string, payload: {
    airbnbIcalUrl?: string
    bookingIcalUrl?: string
    vrboIcalUrl?: string
    otherIcalUrls?: string[]
  }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/calendar`, payload)
    return res.data.data
  },

  async connectPayment(orgId: string, payload: {
    stripeAccountId?: string
    paypalAccountId?: string
    chargesEnabled?: boolean
    payoutsEnabled?: boolean
  }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/payment`, payload)
    return res.data.data
  },

  async connectDomain(orgId: string, payload: { domain: string }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/domain`, payload)
    return res.data.data
  },

  async checkDomainDns(orgId: string): Promise<{ verified: boolean; message: string; domain: string; cnameTarget: string }> {
    const res = await apiClient.post<Res<{ verified: boolean; message: string; domain: string; cnameTarget: string }>>(
      `/organizations/${orgId}/verification/domain/check-dns`)
    return res.data.data
  },

  async deleteDomain(orgId: string): Promise<VerificationProgress> {
    const res = await apiClient.delete<Res<VerificationProgress>>(`/organizations/${orgId}/verification/domain`)
    return res.data.data
  },

  async testIcal(url: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<Res<{ success: boolean; message: string }>>('/verification/test-ical', { url })
    return res.data.data
  },

  async adminApprove(orgId: string, payload: {
    approved: boolean; notes?: string; rejectionReason?: string
  }): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(`/admin/verification/${orgId}/approve`, payload)
    return res.data.data
  },

  async adminApproveStep(orgId: string, step: string, approved: boolean, reason?: string): Promise<VerificationProgress> {
    const res = await apiClient.post<Res<VerificationProgress>>(
      `/admin/verification/${orgId}/step/${step}?approved=${approved}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`)
    return res.data.data
  },

  async listPending(page = 0, size = 20): Promise<{ content: VerificationProgress[]; totalElements: number }> {
    const res = await apiClient.get<Res<{ content: VerificationProgress[]; totalElements: number }>>(
      `/admin/verification/pending?page=${page}&size=${size}`)
    return res.data.data
  },

  async listAll(page = 0, size = 20): Promise<{ content: VerificationProgress[]; totalElements: number }> {
    const res = await apiClient.get<Res<{ content: VerificationProgress[]; totalElements: number }>>(
      `/admin/verification/all?page=${page}&size=${size}`)
    return res.data.data
  },

  async getStripeConnectUrl(orgId: string): Promise<{ url: string; dev?: string }> {
    const res = await apiClient.get<Res<{ url: string; dev?: string }>>(`/stripe/connect-url?orgId=${orgId}`)
    return res.data.data
  },

  async getPaypalConnectUrl(orgId: string): Promise<{ url: string; dev?: string }> {
    const res = await apiClient.get<Res<{ url: string; dev?: string }>>(`/paypal/connect-url?orgId=${orgId}`)
    return res.data.data
  },

  async togglePaymentMethod(orgId: string, provider: 'stripe' | 'paypal', enabled: boolean): Promise<void> {
    await apiClient.patch(`/organizations/${orgId}/verification/payment-methods`, { provider, enabled })
  },
}
