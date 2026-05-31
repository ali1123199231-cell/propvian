import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, BarChart2, Calendar, DollarSign, Users } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { directBookingApi } from '@/api/directBooking'
import { useAuthStore } from '@/store/authStore'
import type { DirectBookingStatus } from '@/types'

const STATUS_ORDER: DirectBookingStatus[] = ['CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']
const STATUS_COLORS: Record<DirectBookingStatus, string> = {
  CONFIRMED:      'bg-green-500',
  PENDING_PAYMENT:'bg-amber-500',
  CHECKED_IN:     'bg-blue-500',
  CHECKED_OUT:    'bg-gray-400',
  CANCELLED:      'bg-red-400',
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const RANGES = [
  { label: '3M',  months: 3 },
  { label: '6M',  months: 6 },
  { label: '12M', months: 12 },
]

export function DirectAnalyticsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const [range, setRange] = useState(6)

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['direct-bookings', orgId, 'analytics'],
    queryFn:  () => directBookingApi.list(orgId, 0, 500),
    enabled:  !!orgId,
  })

  const all = bookings?.content ?? []

  const totalRevenue    = all.filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_OUT')
                             .reduce((s, b) => s + (b.totalAmount ?? 0), 0)
  const confirmedCount  = all.filter((b) => b.status === 'CONFIRMED').length
  const cancelledCount  = all.filter((b) => b.status === 'CANCELLED').length
  const occupancyRate   = all.length > 0
    ? Math.round((confirmedCount / all.length) * 100)
    : 0

  const byStatus = STATUS_ORDER.map((s) => ({
    status: s,
    count:  all.filter((b) => b.status === s).length,
    color:  STATUS_COLORS[s],
  }))

  // Build monthly revenue chart data for last N months
  const now = new Date()
  const monthlyData = Array.from({ length: range }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (range - 1 - i), 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const key = `${yr}-${String(mo + 1).padStart(2, '0')}`
    const rev = all
      .filter((b) =>
        (b.status === 'CONFIRMED' || b.status === 'CHECKED_OUT') &&
        b.checkInDate.startsWith(key)
      )
      .reduce((s, b) => s + (b.totalAmount ?? 0), 0)
    const bookingCount = all.filter((b) => b.checkInDate.startsWith(key)).length
    return { month: MONTH_NAMES[mo], revenue: rev, bookings: bookingCount }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Booking performance and revenue insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total revenue',    value: `$${totalRevenue.toLocaleString()}`, color: 'bg-green-50 text-green-600' },
          { icon: Calendar,   label: 'Total bookings',   value: all.length, color: 'bg-blue-50 text-blue-600' },
          { icon: TrendingUp, label: 'Confirmed',        value: confirmedCount, color: 'bg-primary-50 text-primary-600' },
          { icon: Users,      label: 'Conversion rate',  value: `${occupancyRate}%`, color: 'bg-purple-50 text-purple-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary-500" /> Monthly Revenue
          </h2>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => setRange(r.months)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  range === r.months ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {all.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            No bookings yet — revenue will appear here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Booking status breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 size={14} className="text-primary-500" /> Bookings by Status
        </h2>
        {all.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
        ) : (
          <div className="space-y-3">
            {byStatus.filter((s) => s.count > 0).map(({ status, count, color }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28">{status.replace('_', ' ')}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color} transition-all`}
                    style={{ width: `${(count / all.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
