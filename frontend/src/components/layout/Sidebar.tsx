import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Calendar, Lock, Bell,
  Settings, LogOut, CreditCard, Plug, Lock as LockIcon,
  ShieldCheck, Globe, Star, MessageCircle, BarChart2,
  Home, Wallet, CheckSquare, SlidersHorizontal,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { authApi } from '@/api/auth'
import clsx from 'clsx'

// ── TTLock navigation ─────────────────────────────────────────────────────────

const ttlockNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
  { icon: Building2,       label: 'Properties',   to: '/properties' },
  { icon: Calendar,        label: 'Reservations', to: '/reservations' },
  { icon: Lock,            label: 'Locks',        to: '/locks' },
  { icon: Plug,            label: 'Integrations', to: '/integrations' },
  { icon: Bell,            label: 'Notifications',to: '/notifications' },
]

const ttlockBottomItems = [
  { icon: CreditCard,          label: 'Billing',       to: '/billing' },
  { icon: Settings,            label: 'Settings',      to: '/settings' },
]

const ttlockAdminItems = [
  { icon: SlidersHorizontal,   label: 'System Config', to: '/system-config' },
]

// ── Direct Booking navigation ─────────────────────────────────────────────────

const dbNavSections = [
  {
    heading: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { icon: Building2, label: 'Properties',   to: '/properties' },
      { icon: Calendar,  label: 'Calendar',     to: '/calendar' },
      { icon: CheckSquare, label: 'Reservations', to: '/reservations' },
    ],
  },
  {
    heading: 'Revenue',
    items: [
      { icon: Wallet,   label: 'Payments',  to: '/payments' },
      { icon: Star,     label: 'Reviews',   to: '/reviews' },
      { icon: BarChart2,label: 'Analytics', to: '/analytics' },
    ],
  },
  {
    heading: 'Website',
    items: [
      { icon: Home,         label: 'Website Builder', to: '/website' },
      { icon: Globe,        label: 'Domains',         to: '/domains' },
      { icon: MessageCircle,label: 'Messaging',        to: '/messaging' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { icon: ShieldCheck, label: 'Verification', to: '/verification' },
      { icon: Bell,        label: 'Notifications',to: '/notifications' },
    ],
  },
]

const dbBottomItems = [
  { icon: CreditCard,          label: 'Billing',       to: '/billing' },
  { icon: Settings,            label: 'Settings',      to: '/settings' },
]

const dbAdminItems = [
  { icon: SlidersHorizontal,   label: 'System Config', to: '/system-config' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, activeOrg, logout } = useAuthStore()
  const { isDirectBooking }         = useSystemStore()
  const navigate                    = useNavigate()
  const isDirect                    = isDirectBooking()

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
      <span>{label}</span>
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
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <LockIcon size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-lg">Propvian</span>
      </div>

      {/* Account name */}
      {activeOrg && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 bg-primary-50 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-primary-600 text-xs font-bold">
                {activeOrg.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">{activeOrg.name}</span>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isDirect ? (
          // ── Direct booking navigation ──────────────────────────────────────
          <div className="space-y-4">
            {dbNavSections.map((section) => (
              <div key={section.heading ?? 'main'}>
                {section.heading && (
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    {section.heading}
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
          // ── TTLock navigation ──────────────────────────────────────────────
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
        {user?.role === 'SUPER_ADMIN' && (isDirect ? dbAdminItems : ttlockAdminItems).map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}

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
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
