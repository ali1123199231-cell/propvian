import { useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, ShieldCheck, Building2, Users, CreditCard,
  AlertTriangle, LifeBuoy, LogOut, Menu, ExternalLink, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { PropvianLogo } from '@/components/PropvianLogo'
import clsx from 'clsx'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/admin' },
  { icon: ShieldCheck,     label: 'Verifications',  to: '/admin/verifications' },
  { icon: Building2,       label: 'Organizations',  to: '/admin/organizations' },
  { icon: Users,           label: 'Users',          to: '/admin/users' },
  { icon: CreditCard,      label: 'Subscriptions',  to: '/admin/subscriptions' },
  { icon: LifeBuoy,        label: 'Support',        to: '/admin/support' },
  { icon: AlertTriangle,   label: 'Error Logs',     to: '/admin/errors' },
]

function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/')
  }

  return (
    <aside className={clsx(
      'flex flex-col w-64 h-screen bg-gray-900 border-r border-gray-700 fixed left-0 top-0 z-30 transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    )}>
      {/* Logo + badge */}
      <div className="px-5 py-5 border-b border-gray-700">
        <PropvianLogo size={28} textClassName="font-semibold text-white text-base" />
        <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onClose}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Back to app */}
        <div className="pt-3 mt-3 border-t border-gray-700">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <ExternalLink size={16} className="flex-shrink-0" />
            Back to App
            <ChevronRight size={12} className="ml-auto" />
          </NavLink>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-xs font-semibold text-amber-400 flex-shrink-0">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/" replace />

  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  if (!isAdminUser) return <Navigate to="/dashboard" replace />

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 md:ml-64 overflow-y-auto bg-gray-950">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-white">Admin Panel</span>
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#1f2937' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />
    </div>
  )
}
