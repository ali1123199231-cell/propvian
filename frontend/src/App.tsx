import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { GuestBookingPage } from '@/pages/public/GuestBookingPage'
import { OrgListingPage } from '@/pages/public/OrgListingPage'

// Subdomain detection: beachvilla.propvian.com → slug = "beachvilla"
const hostname = window.location.hostname
const PLATFORM_DOMAINS = ['propvian.com', 'www.propvian.com', 'localhost', '127.0.0.1']
const isSubdomain = !PLATFORM_DOMAINS.includes(hostname) && hostname.endsWith('.propvian.com')
const subdomainSlug = isSubdomain ? hostname.replace(/\.propvian\.com$/, '') : null

function GuestBookingRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <GuestBookingPage slug={slug!} />
}

// Path-based routes for /sites/:orgSlug
function OrgListingRoute() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  return <OrgListingPage orgSlug={orgSlug!} getPropertyUrl={(s) => `/sites/${orgSlug}/property/${s}`} />
}

function OrgPropertyRoute() {
  const { propertySlug } = useParams<{ propertySlug: string }>()
  return <GuestBookingPage slug={propertySlug!} />
}

// Subdomain property route: myco.propvian.com/property/:propertySlug
function SubdomainPropertyRoute() {
  const { propertySlug } = useParams<{ propertySlug: string }>()
  return <GuestBookingPage slug={propertySlug!} />
}
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminVerificationsPage } from '@/pages/admin/AdminVerificationsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminOrganizationsPage } from '@/pages/admin/AdminOrganizationsPage'
import { AdminSubscriptionsPage } from '@/pages/admin/AdminSubscriptionsPage'
import { AdminErrorLogsPage } from '@/pages/admin/AdminErrorLogsPage'
import { AdminSupportPage } from '@/pages/admin/AdminSupportPage'
import { LandingPage } from '@/pages/LandingPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
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
// Direct Booking pages
import { VerificationPage } from '@/pages/VerificationPage'
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
import { AcceptableUsePage } from '@/pages/legal/AcceptableUsePage'
import { GdprRightsPage } from '@/pages/legal/GdprRightsPage'
import { DpaPage } from '@/pages/legal/DpaPage'
import { SecurityPage } from '@/pages/legal/SecurityPage'
import { DisclaimerPage } from '@/pages/legal/DisclaimerPage'
import { DmcaPage } from '@/pages/legal/DmcaPage'

// SEO landing pages
import { DirectBookingWebsitePage } from '@/pages/marketing/seo/DirectBookingWebsitePage'
import { VacationRentalBuilderPage } from '@/pages/marketing/seo/VacationRentalBuilderPage'
import { AirbnbAlternativePage } from '@/pages/marketing/seo/AirbnbAlternativePage'
import { DirectBookingSoftwarePage } from '@/pages/marketing/seo/DirectBookingSoftwarePage'
import { BookingEnginePage } from '@/pages/marketing/seo/BookingEnginePage'

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
  // Subdomain: myco.propvian.com → org listing; /property/:slug → individual booking
  if (subdomainSlug) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/"
            element={<OrgListingPage orgSlug={subdomainSlug} getPropertyUrl={(s) => `/property/${s}`} />}
          />
          <Route path="/property/:propertySlug" element={<SubdomainPropertyRoute />} />
          <Route path="*"
            element={<OrgListingPage orgSlug={subdomainSlug} getPropertyUrl={(s) => `/property/${s}`} />}
          />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public guest booking by path — works without subdomain DNS */}
        <Route path="/book/:slug" element={<GuestBookingRoute />} />

        {/* Org listing site — path-based fallback for /sites/:orgSlug */}
        <Route path="/sites/:orgSlug" element={<OrgListingRoute />} />
        <Route path="/sites/:orgSlug/property/:propertySlug" element={<OrgPropertyRoute />} />

        {/* Landing / auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth-connect"  element={<OAuthConnectPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
        <Route path="/legal/terms"           element={<TermsPage />} />
        <Route path="/legal/privacy"         element={<PrivacyPage />} />
        <Route path="/legal/cookie-policy"   element={<CookiePolicyPage />} />
        <Route path="/legal/refund-policy"   element={<RefundPage />} />
        <Route path="/legal/acceptable-use"  element={<AcceptableUsePage />} />
        <Route path="/legal/gdpr"            element={<GdprRightsPage />} />
        <Route path="/legal/dpa"             element={<DpaPage />} />
        <Route path="/legal/security"        element={<SecurityPage />} />
        <Route path="/legal/disclaimer"      element={<DisclaimerPage />} />
        <Route path="/legal/dmca"            element={<DmcaPage />} />

        {/* SEO landing pages */}
        <Route path="/direct-booking-website"          element={<DirectBookingWebsitePage />} />
        <Route path="/vacation-rental-website-builder" element={<VacationRentalBuilderPage />} />
        <Route path="/airbnb-alternative"              element={<AirbnbAlternativePage />} />
        <Route path="/direct-booking-software"         element={<DirectBookingSoftwarePage />} />
        <Route path="/booking-engine"                  element={<BookingEnginePage />} />

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

          {/* TTLock-specific */}
          <Route path="/locks"        element={<LocksPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />

          {/* Direct Booking-specific */}
          <Route path="/verification"       element={<VerificationPage />} />
          <Route path="/calendar"     element={<CalendarPage />} />
          <Route path="/payments"     element={<PaymentsPage />} />
          <Route path="/website"      element={<WebsitePage />} />
          <Route path="/domains"      element={<DomainsPage />} />
          <Route path="/reviews"      element={<ReviewsPage />} />
          <Route path="/messaging"    element={<MessagingPage />} />
        </Route>

        {/* Admin panel — separate layout, dark theme */}
        <Route element={<AdminLayout />}>
          <Route path="/admin"                  element={<AdminDashboardPage />} />
          <Route path="/admin/verifications"    element={<AdminVerificationsPage />} />
          <Route path="/admin/users"            element={<AdminUsersPage />} />
          <Route path="/admin/organizations"    element={<AdminOrganizationsPage />} />
          <Route path="/admin/subscriptions"    element={<AdminSubscriptionsPage />} />
          <Route path="/admin/support"          element={<AdminSupportPage />} />
          <Route path="/admin/errors"           element={<AdminErrorLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
