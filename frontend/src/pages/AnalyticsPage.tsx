import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart3, Building2, Lock, Calendar, CheckSquare } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/analytics/StatCard'
import { StatsSkeleton } from '@/components/ui/Skeleton'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6']

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  labelStyle: { color: '#6b7280' },
  itemStyle: { color: '#111827' },
}

export function AnalyticsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: () => analyticsApi.getDashboardStats(orgId!),
    enabled: !!orgId,
  })

  const locksByStatus = stats ? [
    { name: 'Connected', value: stats.connectedLocks },
    { name: 'Total', value: stats.totalLocks },
    { name: 'Disconnected', value: Math.max(0, stats.totalLocks - stats.connectedLocks) },
  ] : []

  const overviewData = stats ? [
    { name: 'Properties', value: stats.totalProperties },
    { name: 'Active', value: stats.activeProperties },
    { name: 'Locks', value: stats.totalLocks },
    { name: 'Connected', value: stats.connectedLocks },
    { name: 'Reservations', value: stats.reservationsThisMonth },
    { name: 'Tasks', value: stats.pendingCleanerTasks },
  ] : []

  return (
    <div>
      <TopBar title="Analytics" />
      <div className="p-6 space-y-6">
        {isLoading ? (
          <StatsSkeleton />
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Properties"
                value={stats.totalProperties}
                subtitle={`${stats.activeProperties} active`}
                icon={Building2}
                iconColor="text-blue-600"
              />
              <StatCard
                title="Connected Locks"
                value={stats.connectedLocks}
                subtitle={`of ${stats.totalLocks} total`}
                icon={Lock}
                iconColor="text-emerald-600"
              />
              <StatCard
                title="Active Reservations"
                value={stats.activeReservations}
                subtitle={`${stats.reservationsThisMonth} this month`}
                icon={Calendar}
                iconColor="text-primary-600"
              />
              <StatCard
                title="Pending Tasks"
                value={stats.pendingCleanerTasks}
                subtitle="Cleaner assignments"
                icon={CheckSquare}
                iconColor="text-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Occupancy rate */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary-600" />
                  Occupancy Rate
                </h3>
                <div className="text-5xl font-bold text-gray-900 mb-3">{stats.occupancyRate}%</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-600 to-primary-400 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${stats.occupancyRate}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">Across all active properties</p>
              </div>

              {/* Overview bar chart */}
              <div className="card p-6 col-span-2">
                <h3 className="font-semibold text-gray-800 mb-4">Platform Overview</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={overviewData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lock status pie */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Lock Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={locksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {locksByStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Notification & tasks summary */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Unread Notifications', value: stats.unreadNotifications, color: 'bg-amber-500' },
                    { label: 'Active Access Codes', value: stats.activeReservations, color: 'bg-emerald-500' },
                    { label: 'Reservations This Month', value: stats.reservationsThisMonth, color: 'bg-primary-500' },
                    { label: 'Pending Cleaner Tasks', value: stats.pendingCleanerTasks, color: 'bg-blue-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                      <div className="flex-1 text-sm text-gray-600">{label}</div>
                      <div className="text-sm font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
