import { apiClient } from './client'
import type { VerificationProgress } from '@/types'
import { logger, shortId } from '@/lib/logger'

type Res<T> = { success: boolean; data: T }

const log = logger.child('AUTH')

export const verificationApi = {
  async getStatus(orgId: string): Promise<VerificationProgress> {
    log.debug('verification.getStatus — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<VerificationProgress>>(`/organizations/${orgId}/verification`)
    log.info('verification.getStatus — adminStep=%s bookingsEnabled=%s',
      res.data.data?.adminStep?.status, res.data.data?.bookingsEnabled)
    return res.data.data
  },

  async submitIdentity(orgId: string, payload: { identityDocumentUrl: string; selfieUrl: string }): Promise<VerificationProgress> {
    log.info('verification.submitIdentity — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/identity`, payload)
    log.info('verification.submitIdentity — success')
    return res.data.data
  },

  async submitProperty(orgId: string, payload: {
    propertyAddressLine: string
    ownershipProofUrl?: string
    managementAuthUrl?: string
    utilityBillUrl?: string
  }): Promise<VerificationProgress> {
    log.info('verification.submitProperty — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/property`, payload)
    log.info('verification.submitProperty — success')
    return res.data.data
  },

  async submitOta(orgId: string, payload: {
    airbnbListingUrl?: string
    bookingListingUrl?: string
    vrboListingUrl?: string
    otherListingUrls?: string[]
  }): Promise<VerificationProgress> {
    log.info('verification.submitOta — org=%s hasAirbnb=%s hasBooking=%s',
      shortId(orgId), !!payload.airbnbListingUrl, !!payload.bookingListingUrl)
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/ota`, payload)
    log.info('verification.submitOta — success')
    return res.data.data
  },

  async connectCalendar(orgId: string, payload: {
    airbnbIcalUrl?: string
    bookingIcalUrl?: string
    vrboIcalUrl?: string
    otherIcalUrls?: string[]
  }): Promise<VerificationProgress> {
    log.info('verification.connectCalendar — org=%s hasAirbnb=%s hasBooking=%s',
      shortId(orgId), !!payload.airbnbIcalUrl, !!payload.bookingIcalUrl)
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/calendar`, payload)
    log.info('verification.connectCalendar — success')
    return res.data.data
  },

  async connectPayment(orgId: string, payload: {
    stripeAccountId?: string
    paypalAccountId?: string
    chargesEnabled?: boolean
    payoutsEnabled?: boolean
  }): Promise<VerificationProgress> {
    log.info('verification.connectPayment — org=%s stripe=%s paypal=%s',
      shortId(orgId), !!payload.stripeAccountId, !!payload.paypalAccountId)
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/payment`, payload)
    log.info('verification.connectPayment — success')
    return res.data.data
  },

  async connectDomain(orgId: string, payload: { domain: string }): Promise<VerificationProgress> {
    log.info('verification.connectDomain — org=%s domain=%s', shortId(orgId), payload.domain)
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/domain`, payload)
    log.info('verification.connectDomain — success')
    return res.data.data
  },

  async checkDomainDns(orgId: string): Promise<{ verified: boolean; message: string; domain: string; cnameTarget: string }> {
    log.info('verification.checkDomainDns — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<{ verified: boolean; message: string; domain: string; cnameTarget: string }>>(
      `/organizations/${orgId}/verification/domain/check-dns`)
    log.info('verification.checkDomainDns — verified=%s domain=%s', res.data.data.verified, res.data.data.domain)
    return res.data.data
  },

  async deleteDomain(orgId: string): Promise<VerificationProgress> {
    log.info('verification.deleteDomain — org=%s', shortId(orgId))
    const res = await apiClient.delete<Res<VerificationProgress>>(`/organizations/${orgId}/verification/domain`)
    log.info('verification.deleteDomain — success')
    return res.data.data
  },

  async confirmDomainRedirect(orgId: string): Promise<VerificationProgress> {
    log.info('verification.confirmDomainRedirect — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<VerificationProgress>>(`/organizations/${orgId}/verification/domain/confirm-redirect`)
    log.info('verification.confirmDomainRedirect — success')
    return res.data.data
  },

  async testIcal(url: string): Promise<{ success: boolean; message: string }> {
    log.info('verification.testIcal — testing iCal URL')
    const res = await apiClient.post<Res<{ success: boolean; message: string }>>('/verification/test-ical', { url })
    log.info('verification.testIcal — success=%s message=%s', res.data.data.success, res.data.data.message)
    return res.data.data
  },

  async adminApprove(orgId: string, payload: {
    approved: boolean; notes?: string; rejectionReason?: string
  }): Promise<VerificationProgress> {
    log.info('admin.approveVerification — org=%s approved=%s', shortId(orgId), payload.approved)
    const res = await apiClient.post<Res<VerificationProgress>>(`/admin/verification/${orgId}/approve`, payload)
    log.info('admin.approveVerification — success')
    return res.data.data
  },

  async adminApproveStep(orgId: string, step: string, approved: boolean, reason?: string): Promise<VerificationProgress> {
    log.info('admin.approveStep — org=%s step=%s approved=%s', shortId(orgId), step, approved)
    const res = await apiClient.post<Res<VerificationProgress>>(
      `/admin/verification/${orgId}/step/${step}?approved=${approved}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`)
    log.info('admin.approveStep — success')
    return res.data.data
  },

  async listPending(page = 0, size = 20): Promise<{ content: VerificationProgress[]; totalElements: number }> {
    log.debug('admin.listPendingVerifications — page=%d', page)
    const res = await apiClient.get<Res<{ content: VerificationProgress[]; totalElements: number }>>(
      `/admin/verification/pending?page=${page}&size=${size}`)
    log.debug('admin.listPendingVerifications — got %d of %d', res.data.data.content.length, res.data.data.totalElements)
    return res.data.data
  },

  async listAll(page = 0, size = 20): Promise<{ content: VerificationProgress[]; totalElements: number }> {
    log.debug('admin.listAllVerifications — page=%d', page)
    const res = await apiClient.get<Res<{ content: VerificationProgress[]; totalElements: number }>>(
      `/admin/verification/all?page=${page}&size=${size}`)
    log.debug('admin.listAllVerifications — got %d', res.data.data.content.length)
    return res.data.data
  },

  async getStripeConnectUrl(orgId: string): Promise<{ url: string; dev?: string }> {
    log.info('verification.getStripeConnectUrl — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<{ url: string; dev?: string }>>(`/stripe/connect-url?orgId=${orgId}`)
    log.info('verification.getStripeConnectUrl — URL received')
    return res.data.data
  },

  async getPaypalConnectUrl(orgId: string): Promise<{ url: string; dev?: string }> {
    log.info('verification.getPaypalConnectUrl — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<{ url: string; dev?: string }>>(`/paypal/connect-url?orgId=${orgId}`)
    log.info('verification.getPaypalConnectUrl — URL received')
    return res.data.data
  },

  async togglePaymentMethod(orgId: string, provider: 'stripe' | 'paypal', enabled: boolean): Promise<void> {
    log.info('verification.togglePaymentMethod — org=%s provider=%s enabled=%s', shortId(orgId), provider, enabled)
    await apiClient.patch(`/organizations/${orgId}/verification/payment-methods`, { provider, enabled })
    log.info('verification.togglePaymentMethod — success')
  },
}
