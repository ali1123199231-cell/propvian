import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, ChevronDown } from 'lucide-react'
import { PropvianLogo } from '@/components/PropvianLogo'
import { systemConfigApi } from '@/api/systemConfig'

// Labels are keys under common:menu
const integrationsDB = [
  { label: 'airbnb', href: '/integrations/airbnb' },
  { label: 'bookingCom', href: '/integrations/booking-com' },
]

const integrationsTTLock = [
  { label: 'airbnb', href: '/integrations/airbnb' },
  { label: 'bookingCom', href: '/integrations/booking-com' },
  { label: 'ttlock', href: '/integrations/ttlock' },
]

const featuresDB = [
  { label: 'directBookingWebsite', href: '/features/self-checkin' },
  { label: 'calendarSync',         href: '/integrations/airbnb' },
]

const featuresTTLock = [
  { label: 'guestCodes',  href: '/features/guest-code-automation' },
  { label: 'selfCheckIn', href: '/features/self-checkin' },
]

export function MarketingNav() {
  const { t } = useTranslation('common')
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [integrationsOpen, setIntegrationsOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen]     = useState(false)
  const [isDirect, setIsDirect]             = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    systemConfigApi.getBusinessModel().then(m => setIsDirect(m === 'direct_booking')).catch(() => {})
  }, [])

  const integrations = isDirect ? integrationsDB  : integrationsTTLock
  const features     = isDirect ? featuresDB      : featuresTTLock
  const ctaLabel     = isDirect ? t('nav.getStarted') : t('nav.startTrial')

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <PropvianLogo size={32} textClassName="text-lg font-bold text-gray-900 tracking-tight" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Integrations dropdown */}
            <div className="relative" onMouseEnter={() => setIntegrationsOpen(true)} onMouseLeave={() => setIntegrationsOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                {t('nav.integrations')} <ChevronDown size={14} className={`transition-transform ${integrationsOpen ? 'rotate-180' : ''}`} />
              </button>
              {integrationsOpen && (
                <div className="absolute top-full left-0 pt-1 w-52">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
                    {integrations.map((item) => (
                      <Link key={item.href} to={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        {t(`menu.${item.label}`)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Features dropdown */}
            <div className="relative" onMouseEnter={() => setFeaturesOpen(true)} onMouseLeave={() => setFeaturesOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                {t('nav.features')} <ChevronDown size={14} className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              {featuresOpen && (
                <div className="absolute top-full left-0 pt-1 w-56">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
                    {features.map((item) => (
                      <Link key={item.href} to={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        {t(`menu.${item.label}`)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link to="/blog" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              {t('nav.blog')}
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/', { state: { tab: 'signin' } })}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              {t('nav.login')}
            </button>
            <button onClick={() => navigate('/', { state: { tab: 'signup' } })}
              className="btn-primary py-2 px-5 text-sm">
              {ctaLabel}
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={t('nav.openMenu')} aria-expanded={mobileOpen} className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1 pb-0.5">{t('nav.integrations')}</p>
          {integrations.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              {t(`menu.${item.label}`)}
            </Link>
          ))}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-0.5">{t('nav.features')}</p>
          {features.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              {t(`menu.${item.label}`)}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 pb-1 space-y-2">
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">{t('nav.pricing')}</Link>
            <Link to="/blog" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">{t('nav.blog')}</Link>
            <button onClick={() => { setMobileOpen(false); navigate('/') }}
              className="btn-primary w-full justify-center py-2.5 mt-2">{ctaLabel}</button>
          </div>
        </div>
      )}
    </nav>
  )
}
