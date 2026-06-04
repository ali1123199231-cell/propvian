import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = ['', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    ACTIVE:    'bg-green-900/40 text-green-300 border-green-700/40',
    TRIALING:  'bg-blue-900/40 text-blue-300 border-blue-700/40',
    PAST_DUE:  'bg-red-900/40 text-red-300 border-red-700/40',
    CANCELLED: 'bg-gray-700 text-gray-400 border-gray-600',
    EXPIRED:   'bg-gray-700 text-gray-400 border-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg[status] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {status}
    </span>
  )
}

export function AdminSubscriptionsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subs', status, page],
    queryFn: () => adminApi.listSubscriptions(status || undefined, page),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-400 text-sm mt-0.5">{data ? `${data.totalElements} total` : ''}</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s || 'ALL'}
            onClick={() => { setStatus(s); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === s
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quota</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Trial End</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Period End</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : data?.content.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">No subscriptions</td></tr>
            ) : data?.content.map(sub => (
              <tr key={sub.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-200">{sub.organizationName}</p>
                  <p className="text-xs text-gray-500 font-mono">{sub.organizationId.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{sub.ownerEmail ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-400 capitalize">{sub.paymentProvider ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{sub.lockQuota ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-red-400">
                  {sub.failedPaymentAt ? new Date(sub.failedPaymentAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page + 1} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={data.first} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
            <button disabled={data.last}  onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
