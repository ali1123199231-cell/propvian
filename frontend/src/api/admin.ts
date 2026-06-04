import { apiClient } from './client'

type Res<T> = { success: boolean; data: T }

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
    const res = await apiClient.get<Res<AdminDashboard>>('/admin/dashboard')
    return res.data.data
  },

  // Users
  async listUsers(q?: string, page = 0, size = 20): Promise<PageResponse<AdminUser>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (q) params.set('q', q)
    const res = await apiClient.get<Res<PageResponse<AdminUser>>>(`/admin/users?${params}`)
    return res.data.data
  },
  async getUser(userId: string): Promise<AdminUser> {
    const res = await apiClient.get<Res<AdminUser>>(`/admin/users/${userId}`)
    return res.data.data
  },
  async changeUserRole(userId: string, role: string): Promise<AdminUser> {
    const res = await apiClient.put<Res<AdminUser>>(`/admin/users/${userId}/role`, { role })
    return res.data.data
  },
  async deactivateUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`)
  },

  // Organizations
  async listOrganizations(q?: string, page = 0, size = 20): Promise<PageResponse<AdminOrg>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (q) params.set('q', q)
    const res = await apiClient.get<Res<PageResponse<AdminOrg>>>(`/admin/organizations?${params}`)
    return res.data.data
  },
  async getOrganization(orgId: string): Promise<AdminOrg> {
    const res = await apiClient.get<Res<AdminOrg>>(`/admin/organizations/${orgId}`)
    return res.data.data
  },
  async suspendOrganization(orgId: string): Promise<void> {
    await apiClient.post(`/admin/organizations/${orgId}/suspend`)
  },
  async restoreOrganization(orgId: string): Promise<void> {
    await apiClient.post(`/admin/organizations/${orgId}/restore`)
  },

  // Subscriptions
  async listSubscriptions(status?: string, page = 0, size = 20): Promise<PageResponse<AdminSubscription>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.set('status', status)
    const res = await apiClient.get<Res<PageResponse<AdminSubscription>>>(`/admin/subscriptions?${params}`)
    return res.data.data
  },

  // Error logs
  async listErrors(page = 0, size = 50): Promise<PageResponse<AdminErrorLog>> {
    const res = await apiClient.get<Res<PageResponse<AdminErrorLog>>>(`/admin/errors?page=${page}&size=${size}`)
    return res.data.data
  },
}
