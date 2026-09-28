import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PropvianLogo } from '@/components/PropvianLogo'

export function MarketingFooter() {
  const { t } = useTranslation('common')
  const year = new Date().getFullYear()
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <PropvianLogo size={32} textClassName="text-lg font-bold text-white" />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">{t('footer.blurb')}</p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">{t('footer.product')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/direct-booking-website" className="hover:text-white transition-colors">{t('menu.directBookingWebsite')}</Link></li>
              <li><Link to="/vacation-rental-website-builder" className="hover:text-white transition-colors">{t('menu.websiteBuilder')}</Link></li>
              <li><Link to="/booking-engine" className="hover:text-white transition-colors">{t('menu.bookingEngine')}</Link></li>
              <li><Link to="/airbnb-alternative" className="hover:text-white transition-colors">{t('menu.airbnbAlternative')}</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">{t('footer.resources')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/blog" className="hover:text-white transition-colors">{t('nav.blog')}</Link></li>
              <li><Link to="/integrations/airbnb" className="hover:text-white transition-colors">{t('menu.airbnb')}</Link></li>
              <li><Link to="/integrations/booking-com" className="hover:text-white transition-colors">{t('menu.bookingCom')}</Link></li>
              <li><Link to="/legal/security" className="hover:text-white transition-colors">{t('menu.security')}</Link></li>
            </ul>
          </div>

          {/* Legal (the documents themselves are in English) */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">{t('footer.legal')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/legal/cookie-policy" className="hover:text-white transition-colors">{t('footer.cookies')}</Link></li>
              <li><Link to="/legal/refund-policy" className="hover:text-white transition-colors">{t('footer.refund')}</Link></li>
              <li><Link to="/legal/acceptable-use" className="hover:text-white transition-colors">{t('footer.acceptableUse')}</Link></li>
              <li><Link to="/legal/dpa" className="hover:text-white transition-colors">{t('footer.dpa')}</Link></li>
              <li><Link to="/legal/gdpr" className="hover:text-white transition-colors">{t('footer.gdpr')}</Link></li>
              <li><Link to="/legal/disclaimer" className="hover:text-white transition-colors">{t('footer.disclaimer')}</Link></li>
              <li><Link to="/legal/dmca" className="hover:text-white transition-colors">{t('footer.dmca')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} Propvian. {t('footer.rights')}</p>
          <p>{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  )
}
