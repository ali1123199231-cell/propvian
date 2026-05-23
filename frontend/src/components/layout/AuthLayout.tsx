import { Outlet, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-500 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">SmartLock</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Automate guest access<br />for your properties
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Sync your Airbnb calendar, automatically generate PINs, send them to guests,
            and manage cleaners — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Properties managed', value: '10K+' },
              { label: 'Access codes sent', value: '500K+' },
              { label: 'Platforms supported', value: '3' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-primary-100 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-200 text-sm">
          © 2025 SmartLock. Enterprise-grade access automation.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
        }}
      />
    </div>
  )
}
