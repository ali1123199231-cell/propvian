import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

export function MarketingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Lock size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">Propvian</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Smart lock automation for Airbnb and Booking.com hosts. Automatically generate and revoke guest access codes.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/features/guest-code-automation" className="hover:text-white transition-colors">Guest Code Automation</Link></li>
              <li><Link to="/features/self-checkin" className="hover:text-white transition-colors">Self Check-In</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Integrations</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/integrations/airbnb" className="hover:text-white transition-colors">Airbnb</Link></li>
              <li><Link to="/integrations/booking-com" className="hover:text-white transition-colors">Booking.com</Link></li>
              <li><Link to="/integrations/ttlock" className="hover:text-white transition-colors">TTLock</Link></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link to="/legal/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} Propvian. All rights reserved.</p>
          <p>Smart lock automation for short-term rental hosts worldwide.</p>
        </div>
      </div>
    </footer>
  )
}
