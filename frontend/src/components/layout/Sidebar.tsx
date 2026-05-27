import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Calendar, Lock, Bell,
  Settings, LogOut, CreditCard, Plug, Lock as LockIcon
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import clsx from 'clsx'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Building2, label: 'Properties', to: '/properties' },
  { icon: Calendar, label: 'Reservations', to: '/reservations' },
  { icon: Lock, label: 'Locks', to: '/locks' },
  { icon: Plug, label: 'Integrations', to: '/integrations' },
  { icon: Bell, label: 'Notifications', to: '/notifications' },
]

const bottomItems = [
  { icon: CreditCard, label: 'Billing', to: '/billing' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, activeOrg, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/login')
  }

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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active')
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active')
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
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
