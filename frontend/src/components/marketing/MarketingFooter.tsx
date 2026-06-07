import { Link } from 'react-router-dom'
import { PropvianLogo } from '@/components/PropvianLogo'

export function MarketingFooter() {
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
            <p className="text-sm leading-relaxed max-w-xs">
              Direct booking platform for short-term rental hosts. Accept bookings, manage properties, and automate guest access — all in one place.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/direct-booking-website" className="hover:text-white transition-colors">Direct Booking Website</Link></li>
              <li><Link to="/vacation-rental-website-builder" className="hover:text-white transition-colors">Website Builder</Link></li>
              <li><Link to="/booking-engine" className="hover:text-white transition-colors">Booking Engine</Link></li>
              <li><Link to="/airbnb-alternative" className="hover:text-white transition-colors">Airbnb Alternative</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Resources</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/integrations/airbnb" className="hover:text-white transition-colors">Airbnb Integration</Link></li>
              <li><Link to="/integrations/booking-com" className="hover:text-white transition-colors">Booking.com Integration</Link></li>
              <li><Link to="/legal/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Legal</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link to="/legal/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link to="/legal/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link></li>
              <li><Link to="/legal/dpa" className="hover:text-white transition-colors">Data Processing Agreement</Link></li>
              <li><Link to="/legal/gdpr" className="hover:text-white transition-colors">GDPR Rights</Link></li>
              <li><Link to="/legal/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link to="/legal/dmca" className="hover:text-white transition-colors">DMCA / Copyright</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} Propvian. All rights reserved.</p>
          <p>Direct booking platform for short-term rental hosts worldwide.</p>
        </div>
      </div>
    </footer>
  )
}
