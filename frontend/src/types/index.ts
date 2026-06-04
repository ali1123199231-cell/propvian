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


export interface Property {
  id: string
  organizationId: string
  name: string
  propertyType?: string
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
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'ARCHIVED'
  cleanerUserId?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  lockCount: number
  activeReservationCount: number
  // Direct booking pricing
  currency?: string
  baseNightlyRate?: number
  cleaningFee?: number
  securityDeposit?: number
  minStayNights?: number
  maxStayNights?: number
  checkInTime?: string
  checkOutTime?: string
  instantBooking?: boolean
  slug?: string
  // Business rules
  cancellationPolicy?: string
  bufferDaysBefore?: number
  bufferDaysAfter?: number
  depositRequired?: boolean
  depositPercent?: number
  // Location coordinates
  latitude?: number
  longitude?: number
  createdAt: string
  photos?: PropertyPhoto[]
}

// ── Calendar Engine ───────────────────────────────────────────────────────────

export type CalendarIntervalState = 'BOOKED' | 'BLOCKED' | 'RESERVED' | 'MAINTENANCE' | 'BUFFER'

export interface CalendarInterval {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  state: CalendarIntervalState
  bookingId?: string
  holdId?: string
  note?: string
  expiresAt?: string
}

export interface BookingHold {
  holdId: string
  intervalId: string
  expiresAt: string
}

export interface PropertyHouseRule {
  id: string
  propertyId: string
  ruleKey: string
  allowed: boolean
  notes?: string
}

export interface PropertySeasonalRule {
  id: string
  propertyId: string
  name?: string
  startDate: string
  endDate: string
  minStayDays?: number
  maxStayDays?: number
  bufferDaysBefore?: number
  bufferDaysAfter?: number
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
  hasLocks: boolean
  hasIntegration: boolean
}

export interface BillingStatus {
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  trialActive: boolean
  paidActive: boolean
  accessActive: boolean
  trialEnd?: string
  currentPeriodEnd?: string
  lockQuota: number
  usedLocks: number
  cancelAtPeriodEnd: boolean
  paymentProvider?: 'STRIPE' | 'PAYPAL'
  failedPaymentAt?: string
}

// ── Business model & system config ───────────────────────────────────────────

export type BusinessModel = 'ttlock' | 'direct_booking'

export interface SystemConfig {
  businessModel: BusinessModel
  verificationSteps: {
    identityEnabled: boolean
    propertyEnabled: boolean
    otaEnabled: boolean
    calendarEnabled: boolean
    paymentEnabled: boolean
    domainEnabled: boolean
    adminApprovalEnabled: boolean
  }
}

// ── Verification ──────────────────────────────────────────────────────────────

export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface VerificationStepStatus {
  key: string
  label: string
  status: VerificationStatus
  enabled: boolean
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  data?: string[]
}

export interface VerificationProgress {
  organizationId: string
  bookingsEnabled: boolean
  completedSteps: number
  totalRequiredSteps: number
  progressPercent: number
  identityStep: VerificationStepStatus
  propertyStep: VerificationStepStatus
  otaStep: VerificationStepStatus
  calendarStep: VerificationStepStatus
  paymentStep: VerificationStepStatus
  domainStep: VerificationStepStatus
  adminStep: VerificationStepStatus
  identityStepEnabled: boolean
  propertyStepEnabled: boolean
  otaStepEnabled: boolean
  calendarStepEnabled: boolean
  paymentStepEnabled: boolean
  domainStepEnabled: boolean
  adminStepEnabled: boolean
  blockingReason?: string
}

// ── Direct Booking ────────────────────────────────────────────────────────────

export type DirectBookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'

export interface DirectBooking {
  id: string
  propertyId: string
  organizationId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  numberOfGuests: number
  checkInDate: string
  checkOutDate: string
  totalAmount?: number
  currency: string
  paymentProvider?: string
  paymentStatus: string
  status: DirectBookingStatus
  cancelledAt?: string
  cancellationReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ── Property extras for direct booking ────────────────────────────────────────

export interface PropertyPhoto {
  id: string
  propertyId: string
  url: string
  caption?: string
  sortOrder: number
  primary: boolean
  createdAt: string
}

export interface PropertyAmenity {
  id: string
  propertyId: string
  category: string
  name: string
  icon?: string
}

export interface PropertyDomain {
  id: string
  organizationId: string
  domain: string
  sslStatus: 'PENDING' | 'ACTIVE' | 'FAILED'
  dnsValidated: boolean
  dnsValidatedAt?: string
  primary: boolean
  createdAt: string
}

// ── Guest Review ──────────────────────────────────────────────────────────────

export interface GuestReview {
  id: string
  propertyId: string
  bookingId?: string
  guestName?: string
  rating: number
  comment?: string
  cleanlinessRating?: number
  communicationRating?: number
  locationRating?: number
  accuracyRating?: number
  hostReply?: string
  hostRepliedAt?: string
  publicReview: boolean
  createdAt: string
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
