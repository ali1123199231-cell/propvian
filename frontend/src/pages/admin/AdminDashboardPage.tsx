import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import {
  Users, Building2, ShieldCheck, CreditCard,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react'

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string
  value: number | string
  icon: typeof Users
  color: string
  sub?: string
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !data) return (
    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-red-400">
      Failed to load dashboard stats.
    </div>
  )

  const stats = [
    { label: 'Total Users',           value: data.totalUsers,           icon: Users,         color: 'bg-blue-600',   sub: 'registered accounts' },
    { label: 'Organizations',         value: data.totalOrganizations,   icon: Building2,     color: 'bg-purple-600', sub: 'active tenants' },
    { label: 'Pending Verifications', value: data.pendingVerifications, icon: Clock,         color: 'bg-amber-600',  sub: 'awaiting review' },
    { label: 'Approved Hosts',        value: data.approvedVerifications,icon: CheckCircle,   color: 'bg-green-600',  sub: 'verified' },
    { label: 'Active Subscriptions',  value: data.activeSubscriptions,  icon: CreditCard,    color: 'bg-indigo-600', sub: `+ ${data.trialingSubscriptions} trialing` },
    { label: 'Errors (24h)',          value: data.recentErrors,         icon: AlertTriangle, color: data.recentErrors > 0 ? 'bg-red-600' : 'bg-gray-600', sub: 'recent backend errors' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/verifications" className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
            Review Verifications {data.pendingVerifications > 0 && `(${data.pendingVerifications})`}
          </a>
          <a href="/admin/users" className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors">
            Manage Users
          </a>
          <a href="/admin/errors" className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors">
            Error Logs {data.recentErrors > 0 && <span className="text-red-400">({data.recentErrors})</span>}
          </a>
        </div>
      </div>
    </div>
  )
}
