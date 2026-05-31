import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, Calendar, DollarSign, Star, AlertTriangle,
  CheckCircle, Clock, Users, ArrowRight, Plus,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { verificationApi } from '@/api/verification'
import { directBookingApi } from '@/api/directBooking'
import { useAuthStore } from '@/store/authStore'
import type { VerificationProgress } from '@/types'

// ── Verification warning card ─────────────────────────────────────────────────

function VerificationCard({ progress }: { progress: VerificationProgress }) {
  if (progress.bookingsEnabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">Bookings are live!</p>
          <p className="text-xs text-green-600 mt-0.5">All verification steps complete. Guests can book your property.</p>
        </div>
        <Link to="/verification" className="text-xs text-green-700 font-medium hover:underline flex items-center gap-1">
          View details <ArrowRight size={12} />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-800">
              Complete Property Verification ({progress.completedSteps} of {progress.totalRequiredSteps} steps completed)
            </p>
            <span className="text-xs font-bold text-amber-700">{progress.progressPercent}%</span>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            {progress.blockingReason ?? 'Complete all verification steps to enable bookings.'}
          </p>
          <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
        <Link
          to="/verification"
          className="btn-primary py-1.5 px-3 text-xs flex-shrink-0"
        >
          Continue <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof TrendingUp
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Recent bookings ───────────────────────────────────────────────────────────

function RecentBookings({ orgId }: { orgId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['direct-bookings', orgId, 'recent'],
    queryFn:  () => directBookingApi.list(orgId, 0, 5),
    enabled:  !!orgId,
  })

  const statusColor: Record<string, string> = {
    CONFIRMED:      'bg-green-100 text-green-700',
    PENDING_PAYMENT:'bg-amber-100 text-amber-700',
    CANCELLED:      'bg-red-100 text-red-700',
    CHECKED_IN:     'bg-blue-100 text-blue-700',
    CHECKED_OUT:    'bg-gray-100 text-gray-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Reservations</h3>
        <Link to="/reservations" className="text-xs text-primary-600 hover:underline">
          View all
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data?.content.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No reservations yet</p>
      ) : (
        <div className="space-y-2">
          {data.content.map((b) => (
            <div key={b.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                {b.guestName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.guestName}</p>
                <p className="text-xs text-gray-400">{b.checkInDate} → {b.checkOutDate}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {b.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DirectDashboardPage() {
  const { activeOrg } = useAuthStore()
  const orgId         = activeOrg?.id ?? ''
  const navigate      = useNavigate()

  const { data: verification } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
  })

  const { data: bookings } = useQuery({
    queryKey: ['direct-bookings', orgId, 'all'],
    queryFn:  () => directBookingApi.list(orgId, 0, 100),
    enabled:  !!orgId,
  })

  const confirmed    = bookings?.content.filter((b) => b.status === 'CONFIRMED').length ?? 0
  const totalRevenue = bookings?.content
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-0.5">Welcome back, {activeOrg?.name}</p>
        </div>
        <button onClick={() => navigate('/properties')}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={15} /> Add property
        </button>
      </div>

      {/* Verification status (single smart warning) */}
      {verification && <VerificationCard progress={verification} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Calendar}
          label="Confirmed bookings"
          value={confirmed}
          sub="All time"
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={DollarSign}
          label="Total revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          sub="Confirmed bookings"
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={Users}
          label="Total guests"
          value={bookings?.totalElements ?? 0}
          sub="All time"
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          icon={Star}
          label="Avg rating"
          value="0.0"
          sub="No reviews yet"
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBookings orgId={orgId} />

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick actions</h3>
          <div className="space-y-2">
            {[
              { to: '/properties', icon: Star,       label: 'Manage properties' },
              { to: '/calendar',   icon: Calendar,   label: 'View calendar' },
              { to: '/payments',   icon: DollarSign, label: 'Payment setup' },
              { to: '/website',    icon: TrendingUp, label: 'Customize website' },
              { to: '/verification', icon: Clock,    label: 'Verification status' },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                  <Icon size={14} className="text-gray-500 group-hover:text-primary-600" />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                <ArrowRight size={13} className="text-gray-300 ml-auto group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
