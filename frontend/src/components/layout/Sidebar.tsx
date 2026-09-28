import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Calendar, Lock, Bell,
  Settings, LogOut, CreditCard, Plug,
  ShieldCheck, Globe, Star, MessageCircle, BarChart2,
  Home, Wallet, CheckSquare, Shield, CalendarDays, QrCode,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { authApi } from '@/api/auth'
import { PropvianLogo } from '@/components/PropvianLogo'
import clsx from 'clsx'

// Labels are keys under common:nav, section headings under common:navGroups

// ── TTLock navigation ─────────────────────────────────────────────────────────

const ttlockNavItems = [
  { icon: LayoutDashboard, label: 'dashboard',    to: '/dashboard' },
  { icon: Building2,       label: 'properties',   to: '/properties' },
  { icon: Calendar,        label: 'reservations', to: '/reservations' },
  { icon: Lock,            label: 'locks',        to: '/locks' },
  { icon: QrCode,          label: 'guestPages',  to: '/guest-pages' },
  { icon: Plug,            label: 'integrations', to: '/integrations' },
  { icon: Bell,            label: 'notifications',to: '/notifications' },
]

const ttlockBottomItems = [
  { icon: CreditCard, label: 'billing',  to: '/billing' },
  { icon: Settings,   label: 'settings', to: '/settings' },
]

// ── Direct Booking navigation ─────────────────────────────────────────────────

const dbNavSections = [
  {
    heading: null,
    items: [
      { icon: LayoutDashboard, label: 'dashboard', to: '/dashboard' },
    ],
  },
  {
    heading: 'manage',
    items: [
      { icon: Building2,    label: 'properties',   to: '/properties' },
      { icon: Calendar,     label: 'calendar',     to: '/calendar' },
      { icon: CheckSquare,  label: 'reservations', to: '/reservations' },
      { icon: CalendarDays, label: 'integrations', to: '/integrations' },
    ],
  },
  {
    heading: 'revenue',
    items: [
      { icon: Wallet,   label: 'payments',  to: '/payments' },
      { icon: Star,     label: 'reviews',   to: '/reviews' },
      { icon: BarChart2,label: 'analytics', to: '/analytics' },
    ],
  },
  {
    heading: 'website',
    items: [
      { icon: Home,         label: 'websiteBuilder', to: '/website' },
      { icon: Globe,        label: 'domains',         to: '/domains' },
      { icon: QrCode,       label: 'guestPages',     to: '/guest-pages' },
      { icon: MessageCircle,label: 'messaging',       to: '/messaging' },
    ],
  },
  {
    heading: 'account',
    items: [
      { icon: ShieldCheck, label: 'verification', to: '/verification' },
      { icon: Bell,        label: 'notifications',to: '/notifications' },
    ],
  },
]

const dbBottomItems = [
  { icon: CreditCard, label: 'billing',  to: '/billing' },
  { icon: Settings,   label: 'settings', to: '/settings' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation('common')
  const { user, logout } = useAuthStore()
  const { isDirectBooking } = useSystemStore()
  const navigate = useNavigate()
  const isDirect = isDirectBooking()
  const isAdmin  = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/login')
  }

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: typeof Lock; label: string }) => (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{t(`nav.${label}`)}</span>
    </NavLink>
  )

  return (
    <aside
      className={clsx(
        'flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-30 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <PropvianLogo size={32} textClassName="font-semibold text-gray-900 text-lg" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isDirect ? (
          <div className="space-y-4">
            {dbNavSections.map((section) => (
              <div key={section.heading ?? 'main'}>
                {section.heading && (
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    {t(`navGroups.${section.heading}`)}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {ttlockNavItems.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-0.5">
        {(isDirect ? dbBottomItems : ttlockBottomItems).map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}

        {/* Admin panel link — only for admin users */}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 mt-1"
          >
            <Shield size={16} className="flex-shrink-0" />
            <span>{t('nav.adminPanel')}</span>
          </NavLink>
        )}

        {/* User info */}
        <div className="pt-2 mt-2 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
