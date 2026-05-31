import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DirectBookingOnboardingPage } from '@/pages/DirectBookingOnboardingPage'
import { CheckinPage } from '@/pages/CheckinPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { ReservationsPage } from '@/pages/ReservationsPage'
import { LocksPage } from '@/pages/LocksPage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { BillingPage } from '@/pages/BillingPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import { SystemConfigPage } from '@/pages/SystemConfigPage'

// Direct Booking pages
import { VerificationPage } from '@/pages/VerificationPage'
import { AdminVerificationPage } from '@/pages/AdminVerificationPage'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'
import { OAuthConnectPage } from '@/pages/OAuthConnectPage'
import { DirectDashboardPage } from '@/pages/db/DirectDashboardPage'
import { DirectReservationsPage } from '@/pages/db/DirectReservationsPage'
import { CalendarPage } from '@/pages/db/CalendarPage'
import { PaymentsPage } from '@/pages/db/PaymentsPage'
import { WebsitePage } from '@/pages/db/WebsitePage'
import { DomainsPage } from '@/pages/db/DomainsPage'
import { ReviewsPage } from '@/pages/db/ReviewsPage'
import { MessagingPage } from '@/pages/db/MessagingPage'
import { DirectAnalyticsPage } from '@/pages/db/DirectAnalyticsPage'

// Marketing pages
import { BlogListPage } from '@/pages/marketing/BlogListPage'
import { BlogPostPage } from '@/pages/marketing/BlogPostPage'
import { PricingPublicPage } from '@/pages/marketing/PricingPublicPage'
import { AirbnbPage } from '@/pages/marketing/integrations/AirbnbPage'
import { BookingComPage } from '@/pages/marketing/integrations/BookingComPage'
import { TTLockPage } from '@/pages/marketing/integrations/TTLockPage'
import { GuestCodePage } from '@/pages/marketing/features/GuestCodePage'
import { SelfCheckinPage } from '@/pages/marketing/features/SelfCheckinPage'

// Legal pages
import { TermsPage } from '@/pages/legal/TermsPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage'
import { RefundPage } from '@/pages/legal/RefundPage'

// Smart routers — wait for config fetch before committing to a business model
import { useSystemStore } from '@/store/systemStore'

function useModelReady() {
  const { config, loading } = useSystemStore()
  return { ready: !loading && config !== null, isDirect: config?.businessModel === 'direct_booking' }
}

function DashboardRouter() {
  const { ready, isDirect } = useModelReady()
  if (!ready) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
  return isDirect ? <DirectDashboardPage /> : <DashboardPage />
}

function ReservationsRouter() {
  const { ready, isDirect } = useModelReady()
  if (!ready) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
  return isDirect ? <DirectReservationsPage /> : <ReservationsPage />
}

function AnalyticsRouter() {
  const { ready, isDirect } = useModelReady()
  if (!ready) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
  return isDirect ? <DirectAnalyticsPage /> : <AnalyticsPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth-connect"  element={<OAuthConnectPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Onboarding — two flavours */}
        <Route path="/onboarding"        element={<OnboardingPage />} />
        <Route path="/onboarding-direct" element={<DirectBookingOnboardingPage />} />

        {/* Public guest check-in */}
        <Route path="/checkin/:code" element={<CheckinPage />} />

        {/* Marketing — public SEO pages */}
        <Route path="/blog"                         element={<BlogListPage />} />
        <Route path="/blog/:slug"                   element={<BlogPostPage />} />
        <Route path="/pricing"                      element={<PricingPublicPage />} />
        <Route path="/integrations/airbnb"          element={<AirbnbPage />} />
        <Route path="/integrations/booking-com"     element={<BookingComPage />} />
        <Route path="/integrations/ttlock"          element={<TTLockPage />} />
        <Route path="/features/guest-code-automation" element={<GuestCodePage />} />
        <Route path="/features/self-checkin"        element={<SelfCheckinPage />} />

        {/* Legal */}
        <Route path="/legal/terms"        element={<TermsPage />} />
        <Route path="/legal/privacy"      element={<PrivacyPage />} />
        <Route path="/legal/cookie-policy"element={<CookiePolicyPage />} />
        <Route path="/legal/refund-policy"element={<RefundPage />} />

        {/* App (authenticated) — shared + model-aware routes */}
        <Route element={<AppLayout />}>
          {/* Shared routes (model-aware via routers above) */}
          <Route path="/dashboard"    element={<DashboardRouter />} />
          <Route path="/properties"   element={<PropertiesPage />} />
          <Route path="/reservations" element={<ReservationsRouter />} />
          <Route path="/notifications"element={<NotificationsPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/billing"      element={<BillingPage />} />
          <Route path="/analytics"    element={<AnalyticsRouter />} />
          <Route path="/audit-logs"   element={<AuditLogsPage />} />
          <Route path="/system-config" element={<SystemConfigPage />} />

          {/* TTLock-specific */}
          <Route path="/locks"        element={<LocksPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />

          {/* Direct Booking-specific */}
          <Route path="/verification"       element={<VerificationPage />} />
          <Route path="/admin/verification" element={<AdminVerificationPage />} />
          <Route path="/calendar"     element={<CalendarPage />} />
          <Route path="/payments"     element={<PaymentsPage />} />
          <Route path="/website"      element={<WebsitePage />} />
          <Route path="/domains"      element={<DomainsPage />} />
          <Route path="/reviews"      element={<ReviewsPage />} />
          <Route path="/messaging"    element={<MessagingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
