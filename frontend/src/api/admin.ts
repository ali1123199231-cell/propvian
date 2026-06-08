import { apiClient } from './client'
import { logger, shortId, maskEmail } from '@/lib/logger'

type Res<T> = { success: boolean; data: T }

const log = logger.child('SYSTEM')

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface AdminDashboard {
  totalUsers: number
  totalOrganizations: number
  pendingVerifications: number
  approvedVerifications: number
  activeSubscriptions: number
  trialingSubscriptions: number
  recentErrors: number
}

export interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  deleted: boolean
}

export interface AdminOrg {
  id: string
  slug: string
  name: string
  ownerId: string
  ownerEmail?: string
  country?: string
  timezone?: string
  createdAt: string
  deleted: boolean
  subscriptionStatus?: string
  paymentProvider?: string
  trialEnd?: string
  currentPeriodEnd?: string
  lockQuota?: number
  verificationAdminStatus?: string
  bookingsEnabled: boolean
}

export interface AdminSubscription {
  id: string
  organizationId: string
  organizationName: string
  ownerEmail?: string
  status: string
  paymentProvider?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  paypalSubscriptionId?: string
  lockQuota?: number
  trialEnd?: string
  currentPeriodEnd?: string
  failedPaymentAt?: string
  cancelAtPeriodEnd?: boolean
  createdAt: string
}

export interface AdminErrorLog {
  id: string
  userId?: string
  userEmail?: string
  errorCode?: string
  httpStatus: number
  message?: string
  requestPath?: string
  stackTrace?: string
  createdAt: string
}

export const adminApi = {
  async getDashboard(): Promise<AdminDashboard> {
    log.debug('admin.getDashboard')
    const res = await apiClient.get<Res<AdminDashboard>>('/admin/dashboard')
    const d = res.data.data
    log.info('admin.getDashboard — users=%d orgs=%d pendingVerif=%d errors=%d',
      d.totalUsers, d.totalOrganizations, d.pendingVerifications, d.recentErrors)
    return d
  },

  async listUsers(q?: string, page = 0, size = 20): Promise<PageResponse<AdminUser>> {
    log.debug('admin.listUsers — q=%s page=%d', q, page)
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (q) params.set('q', q)
    const res = await apiClient.get<Res<PageResponse<AdminUser>>>(`/admin/users?${params}`)
    log.debug('admin.listUsers — got %d of %d', res.data.data.content.length, res.data.data.totalElements)
    return res.data.data
  },

  async getUser(userId: string): Promise<AdminUser> {
    log.debug('admin.getUser — id=%s', shortId(userId))
    const res = await apiClient.get<Res<AdminUser>>(`/admin/users/${userId}`)
    log.debug('admin.getUser — email=%s role=%s', maskEmail(res.data.data.email), res.data.data.role)
    return res.data.data
  },

  async changeUserRole(userId: string, role: string): Promise<AdminUser> {
    log.info('admin.changeUserRole — userId=%s role=%s', shortId(userId), role)
    const res = await apiClient.put<Res<AdminUser>>(`/admin/users/${userId}/role`, { role })
    log.info('admin.changeUserRole — success')
    return res.data.data
  },

  async deactivateUser(userId: string): Promise<void> {
    log.info('admin.deactivateUser — userId=%s', shortId(userId))
    await apiClient.delete(`/admin/users/${userId}`)
    log.info('admin.deactivateUser — success')
  },

  async listOrganizations(q?: string, page = 0, size = 20): Promise<PageResponse<AdminOrg>> {
    log.debug('admin.listOrganizations — q=%s page=%d', q, page)
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (q) params.set('q', q)
    const res = await apiClient.get<Res<PageResponse<AdminOrg>>>(`/admin/organizations?${params}`)
    log.debug('admin.listOrganizations — got %d of %d', res.data.data.content.length, res.data.data.totalElements)
    return res.data.data
  },

  async getOrganization(orgId: string): Promise<AdminOrg> {
    log.debug('admin.getOrganization — id=%s', shortId(orgId))
    const res = await apiClient.get<Res<AdminOrg>>(`/admin/organizations/${orgId}`)
    log.debug('admin.getOrganization — name=%s status=%s', res.data.data.name, res.data.data.subscriptionStatus)
    return res.data.data
  },

  async suspendOrganization(orgId: string): Promise<void> {
    log.info('admin.suspendOrganization — orgId=%s', shortId(orgId))
    await apiClient.post(`/admin/organizations/${orgId}/suspend`)
    log.info('admin.suspendOrganization — success')
  },

  async restoreOrganization(orgId: string): Promise<void> {
    log.info('admin.restoreOrganization — orgId=%s', shortId(orgId))
    await apiClient.post(`/admin/organizations/${orgId}/restore`)
    log.info('admin.restoreOrganization — success')
  },

  async listSubscriptions(status?: string, page = 0, size = 20): Promise<PageResponse<AdminSubscription>> {
    log.debug('admin.listSubscriptions — status=%s page=%d', status, page)
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.set('status', status)
    const res = await apiClient.get<Res<PageResponse<AdminSubscription>>>(`/admin/subscriptions?${params}`)
    log.debug('admin.listSubscriptions — got %d of %d', res.data.data.content.length, res.data.data.totalElements)
    return res.data.data
  },

  async listErrors(page = 0, size = 50): Promise<PageResponse<AdminErrorLog>> {
    log.debug('admin.listErrors — page=%d size=%d', page, size)
    const res = await apiClient.get<Res<PageResponse<AdminErrorLog>>>(`/admin/errors?page=${page}&size=${size}`)
    log.debug('admin.listErrors — got %d of %d', res.data.data.content.length, res.data.data.totalElements)
    return res.data.data
  },
}
