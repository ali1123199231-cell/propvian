import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, XCircle, Clock, Circle, ChevronRight,
  ShieldCheck, Home, Link, Calendar, CreditCard, Globe, BadgeCheck,
  Loader2, Eye, ThumbsUp, ThumbsDown, FileText, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { verificationApi } from '@/api/verification'
import type { VerificationProgress, VerificationStatus } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: VerificationStatus }) {
  const cfg: Record<VerificationStatus, { color: string; icon: typeof Circle; label: string }> = {
    NOT_STARTED: { color: 'bg-gray-100 text-gray-600',  icon: Circle,       label: 'Not started' },
    PENDING:     { color: 'bg-amber-100 text-amber-700', icon: Clock,        label: 'Pending'     },
    APPROVED:    { color: 'bg-green-100 text-green-700', icon: CheckCircle,  label: 'Approved'    },
    REJECTED:    { color: 'bg-red-100 text-red-700',     icon: XCircle,      label: 'Rejected'    },
  }
  const { color, icon: Icon, label } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={10} /> {label}
    </span>
  )
}

const STEPS = [
  { key: 'identityStep',  icon: ShieldCheck, label: 'Identity'  },
  { key: 'paymentStep',   icon: CreditCard,  label: 'Stripe'    },
  { key: 'propertyStep',  icon: Home,        label: 'Property'  },
  { key: 'otaStep',       icon: Link,        label: 'OTA'       },
  { key: 'calendarStep',  icon: Calendar,    label: 'Calendar'  },
  { key: 'domainStep',    icon: Globe,       label: 'Domain'    },
  { key: 'adminStep',     icon: BadgeCheck,  label: 'Admin'     },
]

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({ v, onClose }: { v: VerificationProgress; onClose: () => void }) {
  const qc = useQueryClient()
  const [notes, setNotes]   = useState('')
  const [reason, setReason] = useState('')
  const [tab, setTab]       = useState<'overview' | 'documents' | 'approve'>('overview')

  const approveMut = useMutation({
    mutationFn: (approved: boolean) =>
      verificationApi.adminApprove(v.organizationId, { approved, notes, rejectionReason: reason }),
    onSuccess: (_, approved) => {
      qc.invalidateQueries({ queryKey: ['admin-verifications'] })
      toast.success(approved ? 'Host approved!' : 'Host rejected')
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed'),
  })

  const stepApproveMut = useMutation({
    mutationFn: ({ step, approved, r }: { step: string; approved: boolean; r?: string }) =>
      verificationApi.adminApproveStep(v.organizationId, step, approved, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verifications'] })
      toast.success('Step updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const propertyData = v.propertyStep?.data ?? []
  const otaData      = v.otaStep?.data ?? []
  const paymentData  = v.paymentStep?.data ?? []
  const domainData   = v.domainStep?.data ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Host Review</h2>
            <p className="text-xs text-gray-400 mt-0.5">Org: {v.organizationId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold ${v.bookingsEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              {v.progressPercent}%
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-200">
          {(['overview', 'documents', 'approve'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="space-y-3">
              {STEPS.map(s => {
                const step = (v as any)[s.key]
                if (!step?.enabled) return null
                const Icon = s.icon
                return (
                  <div key={s.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <Icon size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">{s.label}</span>
                    <StatusChip status={step.status} />
                    {step.submittedAt && (
                      <span className="text-xs text-gray-400 ml-auto">
                        Submitted {new Date(step.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                    {step.status === 'PENDING' && (s.key === 'propertyStep' || s.key === 'otaStep') && (
                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={() => stepApproveMut.mutate({ step: s.key.replace('Step', ''), approved: true })}
                          disabled={stepApproveMut.isPending}
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1">
                          <ThumbsUp size={10} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            const r = window.prompt('Rejection reason:')
                            if (r !== null) stepApproveMut.mutate({ step: s.key.replace('Step', ''), approved: false, r })
                          }}
                          disabled={stepApproveMut.isPending}
                          className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50">
                          <ThumbsDown size={10} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Documents tab */}
          {tab === 'documents' && (
            <div className="space-y-5">
              {/* Property docs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Home size={14} /> Property Documents
                </h3>
                <p className="text-xs text-gray-500 mb-2">Address: {v.propertyStep?.data?.[0] || '—'}</p>
                {[propertyData[0], propertyData[1], propertyData[2]].filter(Boolean).map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg mb-1.5">
                    <FileText size={13} className="text-gray-400" />
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1 truncate">
                      {['Ownership proof', 'Management auth', 'Utility bill'][i]}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>

              {/* OTA listings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Link size={14} /> OTA Listings
                </h3>
                {[otaData[0], otaData[1]].filter(Boolean).map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg mb-1.5">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      {['Airbnb', 'Booking.com'][i]} listing <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
                {otaData[2] && (
                  <p className="text-xs text-gray-500 mt-1">Auto-check: {otaData[2]}</p>
                )}
              </div>

              {/* Payment */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard size={14} /> Payment Account
                </h3>
                {paymentData[0] && (
                  <p className="text-xs text-gray-600">Stripe: {paymentData[0]} · charges {paymentData[1] === 'true' ? '✓' : '✗'} · payouts {paymentData[2] === 'true' ? '✓' : '✗'}</p>
                )}
                {paymentData[3] && <p className="text-xs text-gray-600">PayPal: {paymentData[3]}</p>}
              </div>

              {/* Domain */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Globe size={14} /> Domain
                </h3>
                {domainData[0] && <p className="text-xs text-gray-600">Domain: {domainData[0]}</p>}
              </div>
            </div>
          )}

          {/* Approve/Reject tab */}
          {tab === 'approve' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input-base h-24 resize-none" placeholder="Internal notes about this host…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rejection reason (required if rejecting)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  className="input-base h-20 resize-none" placeholder="Reason for rejection (sent to host)…" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong>Before approving:</strong> Ensure property documents are authentic, OTA listing has 3+ reviews, and Stripe is fully connected.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => approveMut.mutate(true)}
                  disabled={approveMut.isPending}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                  {approveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                  Approve Host
                </button>
                <button
                  onClick={() => approveMut.mutate(false)}
                  disabled={approveMut.isPending || !reason}
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40">
                  {approveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                  Reject Host
                </button>
              </div>
              {!reason && <p className="text-xs text-red-500 text-center">Enter a rejection reason before rejecting</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminVerificationPage() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [selected, setSelected] = useState<VerificationProgress | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', filter],
    queryFn:  () => filter === 'pending' ? verificationApi.listPending() : verificationApi.listAll(),
    refetchInterval: 30000,
  })

  const items = data?.content ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Dashboard</h1>
          <p className="text-gray-500 mt-1">Review and approve host applications</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(['pending', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">No {filter === 'pending' ? 'pending' : ''} verifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Org ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Property</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">OTA</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stripe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(v => (
                <tr key={v.organizationId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">{v.organizationId.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${v.progressPercent}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{v.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusChip status={v.propertyStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.otaStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.paymentStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.adminStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(v)}
                      className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5">
                      <Eye size={11} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <ReviewModal v={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
