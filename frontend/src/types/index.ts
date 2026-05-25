export interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: string
  avatarUrl?: string
  emailVerified?: boolean
  onboardingStep?: string
  onboardingCompleted?: boolean
  organizationId?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface OnboardingState {
  step: string
  completed: boolean
  pendingTtlockLockId?: number
  pendingTtlockLockName?: string
  pendingTtlockStateId?: string
  organizationId?: string
}

export interface Organization {
  id: string
  slug: string
  name: string
  logoUrl?: string
  ownerId: string
  timezone: string
  country?: string
  website?: string
  automationEnabled: boolean
  createdAt: string
}

export interface OrganizationMember {
  id: string
  userId: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role: string
  acceptedAt?: string
  joinedAt?: string
}

export interface Property {
  id: string
  organizationId: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  timezone: string
  description?: string
  imageUrl?: string
  wifiDetails?: string
  accessInstructions?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  cleanerUserId?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  lockCount: number
  activeReservationCount: number
  createdAt: string
}

export interface Lock {
  id: string
  propertyId: string
  name: string
  ttlockLockId?: number
  ttlockLockAlias?: string
  batteryLevel?: number
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING'
  lastSyncAt?: string
  tokenExpiresAt?: string
  notes?: string
  createdAt: string
}

export interface Reservation {
  id: string
  propertyId: string
  propertyName?: string
  guestId?: string
  externalId?: string
  icalUid?: string
  source: 'AIRBNB' | 'BOOKING' | 'VRBO' | 'MANUAL' | 'OTHER'
  status: 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW'
  checkInDate: string
  checkOutDate: string
  timezone: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  numberOfGuests?: number
  notes?: string
  totalAmount?: number
  currency?: string
  syncedAt?: string
  accessCodeSentAt?: string
  checkinCode?: string
  hasAccessCode: boolean
  createdAt: string
}

export interface AccessCode {
  id: string
  reservationId: string
  lockId: string
  pin: string
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'FAILED'
  validFrom: string
  validTo: string
  type: string
  sentToGuestAt?: string
  revokedAt?: string
  createdAt: string
}

export interface CalendarIntegration {
  id: string
  propertyId: string
  platform: string
  icalUrl: string
  displayName?: string
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  syncIntervalMinutes: number
  enabled: boolean
  reservationsSynced: number
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body?: string
  entityType?: string
  entityId?: string
  actionUrl?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface CleanerTask {
  id: string
  reservationId: string
  organizationId: string
  assignedUserId?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  scheduledAt: string
  completedAt?: string
  notes?: string
  checklist?: string[]
  createdAt: string
}

export interface DashboardStats {
  totalProperties: number
  activeProperties: number
  totalLocks: number
  connectedLocks: number
  totalReservations: number
  activeReservations: number
  pendingReservations: number
  reservationsThisMonth: number
  pendingCleanerTasks: number
  unreadNotifications: number
  occupancyRate: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: string
  monthlyPrice: number
  yearlyPrice: number
  maxProperties: number
  maxLocks: number
  maxMembers: number
  features: Record<string, boolean>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface AutomationStatus {
  enabled: boolean
  pendingReservationCount: number
}

export interface CheckinPageData {
  propertyName: string
  guestName?: string
  pin: string
  validFrom: string
  validTo: string
  timezone: string
  wifiDetails?: string
  accessInstructions?: string
  lockNotes?: string
}
