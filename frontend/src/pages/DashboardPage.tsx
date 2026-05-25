import { useQuery } from '@tanstack/react-query'
import { Building2, Lock, Calendar, CheckSquare, BarChart3, TrendingUp, Zap, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { analyticsApi } from '@/api/analytics'
import { reservationsApi } from '@/api/reservations'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/analytics/StatCard'
import { StatsSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { ReservationStatusBadge, SourceBadge } from '@/components/ui/Badge'
import { AutomationStatus } from '@/components/automation/AutomationStatus'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { activeOrg } = useAuthStore()
  const navigate = useNavigate()
  const orgId = activeOrg?.id

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: () => analyticsApi.getDashboardStats(orgId!),
    enabled: !!orgId,
    refetchInterval: 60000,
  })

  const { data: reservationsPage, isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations', orgId, 0, 5],
    queryFn: () => reservationsApi.listByOrg(orgId!, 0, 5),
    enabled: !!orgId,
  })

  const recentReservations = reservationsPage?.content ?? []

  return (
    <div>
      <TopBar
        title="Dashboard"
        action={{ label: 'Add Property', onClick: () => navigate('/properties') }}
      />

      <div className="p-6 space-y-6">
        {/* Automation status */}
        <AutomationStatus />

        {/* Stats grid */}
        {statsLoading ? (
          <StatsSkeleton />
        ) : stats ? (
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
              subtitle={`${stats.totalLocks} total`}
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
        ) : null}

        {/* Occupancy + activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Occupancy rate */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-800">Occupancy Rate</h3>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats?.occupancyRate ?? 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats?.occupancyRate ?? 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">Across all active properties</p>
          </div>

          {/* Quick stats */}
          <div className="card p-6 col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Access Codes Active', value: stats?.activeReservations ?? 0, icon: Zap, color: 'text-emerald-600' },
                { label: 'Unread Notifications', value: stats?.unreadNotifications ?? 0, icon: Clock, color: 'text-amber-600' },
                { label: 'This Month', value: stats?.reservationsThisMonth ?? 0, icon: TrendingUp, color: 'text-blue-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Icon size={20} className={`${color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent reservations */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Recent Reservations</h3>
            <button
              onClick={() => navigate('/reservations')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </button>
          </div>
          {reservationsLoading ? (
            <div className="p-4">
              <TableSkeleton rows={3} />
            </div>
          ) : recentReservations.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No reservations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentReservations.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/reservations`)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-medium">
                      {(r.guestName || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.guestName || r.guestEmail || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(r.checkInDate), 'MMM d')} – {format(parseISO(r.checkOutDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SourceBadge source={r.source} />
                    <ReservationStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
