import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { CheckinPage } from '@/pages/CheckinPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { ReservationsPage } from '@/pages/ReservationsPage'
import { LocksPage } from '@/pages/LocksPage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { BillingPage } from '@/pages/BillingPage'

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Onboarding & public */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/checkin/:code" element={<CheckinPage />} />

        {/* Marketing — public SEO pages */}
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/pricing" element={<PricingPublicPage />} />
        <Route path="/integrations/airbnb" element={<AirbnbPage />} />
        <Route path="/integrations/booking-com" element={<BookingComPage />} />
        <Route path="/integrations/ttlock" element={<TTLockPage />} />
        <Route path="/features/guest-code-automation" element={<GuestCodePage />} />
        <Route path="/features/self-checkin" element={<SelfCheckinPage />} />

        {/* Legal */}
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/legal/refund-policy" element={<RefundPage />} />

        {/* App (authenticated) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/locks" element={<LocksPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
