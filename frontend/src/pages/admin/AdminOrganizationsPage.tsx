import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminOrg } from '@/api/admin'
import {
  Search, ChevronLeft, ChevronRight, Ban, RotateCcw,
  CheckCircle, Clock, XCircle, Circle,
} from 'lucide-react'
import toast from 'react-hot-toast'

function SubStatusBadge({ status }: { status?: string }) {
  const cfg: Record<string, string> = {
    ACTIVE:    'bg-green-900/40 text-green-300 border-green-700/40',
    TRIALING:  'bg-blue-900/40 text-blue-300 border-blue-700/40',
    PAST_DUE:  'bg-red-900/40 text-red-300 border-red-700/40',
    CANCELLED: 'bg-gray-700 text-gray-400 border-gray-600',
    EXPIRED:   'bg-gray-700 text-gray-400 border-gray-600',
  }
  const s = status ?? 'NONE'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg[s] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {s}
    </span>
  )
}

function VerifBadge({ status }: { status?: string }) {
  const cfg: Record<string, { color: string; icon: typeof Circle }> = {
    APPROVED:    { color: 'text-green-400', icon: CheckCircle },
    PENDING:     { color: 'text-amber-400', icon: Clock },
    REJECTED:    { color: 'text-red-400',   icon: XCircle },
    NOT_STARTED: { color: 'text-gray-500',  icon: Circle },
  }
  const { color, icon: Icon } = cfg[status ?? 'NOT_STARTED'] ?? cfg['NOT_STARTED']
  return <Icon size={14} className={color} />
}

function OrgDetailModal({ org, onClose }: { org: AdminOrg; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{org.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>
        <div className="px-6 py-4 space-y-3 text-sm">
          <Row label="Slug"         value={org.slug} />
          <Row label="Owner"        value={org.ownerEmail ?? org.ownerId} />
          <Row label="Country"      value={org.country} />
          <Row label="Timezone"     value={org.timezone} />
          <Row label="Created"      value={new Date(org.createdAt).toLocaleString()} />
          <Row label="Sub Status"   value={<SubStatusBadge status={org.subscriptionStatus} />} />
          <Row label="Payment"      value={org.paymentProvider ?? '—'} />
          <Row label="Lock Quota"   value={org.lockQuota != null ? String(org.lockQuota) : '—'} />
          <Row label="Trial End"    value={org.trialEnd ? new Date(org.trialEnd).toLocaleDateString() : '—'} />
          <Row label="Period End"   value={org.currentPeriodEnd ? new Date(org.currentPeriodEnd).toLocaleDateString() : '—'} />
          <Row label="Verification" value={<span className="flex items-center gap-1"><VerifBadge status={org.verificationAdminStatus} />{org.verificationAdminStatus ?? 'NOT_STARTED'}</span>} />
          <Row label="Bookings"     value={org.bookingsEnabled ? '✅ Enabled' : '❌ Disabled'} />
        </div>
        <div className="px-6 py-4 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-200 flex-1">{value ?? '—'}</span>
    </div>
  )
}

export function AdminOrganizationsPage() {
  const qc = useQueryClient()
  const [q, setQ]           = useState('')
  const [page, setPage]     = useState(0)
  const [selected, setSelected] = useState<AdminOrg | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', q, page],
    queryFn: () => adminApi.listOrganizations(q || undefined, page),
  })

  const suspendMut = useMutation({
    mutationFn: adminApi.suspendOrganization,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orgs'] }); toast.success('Organization suspended') },
    onError: () => toast.error('Failed to suspend'),
  })

  const restoreMut = useMutation({
    mutationFn: adminApi.restoreOrganization,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orgs'] }); toast.success('Organization restored') },
    onError: () => toast.error('Failed to restore'),
  })

  const handleSuspend = (org: AdminOrg) => {
    if (confirm(`Suspend "${org.name}"? Their users will lose access.`)) {
      suspendMut.mutate(org.id)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-gray-400 text-sm mt-0.5">{data ? `${data.totalElements} total` : ''}</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or slug…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(0) }}
          className="w-full max-w-sm pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Subscription</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : data?.content.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No organizations found</td></tr>
            ) : data?.content.map(org => (
              <tr key={org.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(org)} className="text-left">
                    <p className="text-sm font-medium text-amber-400 hover:text-amber-300">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.slug}</p>
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{org.ownerEmail ?? '—'}</td>
                <td className="px-4 py-3"><SubStatusBadge status={org.subscriptionStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <VerifBadge status={org.verificationAdminStatus} />
                    <span className="text-xs text-gray-500">{org.verificationAdminStatus ?? 'NOT_STARTED'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {org.deleted ? (
                    <button
                      onClick={() => restoreMut.mutate(org.id)}
                      className="p-1.5 rounded hover:bg-green-900/30 text-gray-400 hover:text-green-400 transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(org)}
                      className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                      title="Suspend"
                    >
                      <Ban size={14} />
                    </button>
                  )}
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

      {selected && <OrgDetailModal org={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
