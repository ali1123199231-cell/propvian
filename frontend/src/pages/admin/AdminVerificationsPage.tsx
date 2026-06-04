import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, XCircle, Clock, Circle,
  ShieldCheck, Home, Link, Calendar, CreditCard, Globe, BadgeCheck,
  Loader2, Eye, ThumbsUp, ThumbsDown, FileText, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { verificationApi } from '@/api/verification'
import type { VerificationProgress, VerificationStatus } from '@/types'

function StatusChip({ status }: { status: VerificationStatus }) {
  const cfg: Record<VerificationStatus, { color: string; icon: typeof Circle; label: string }> = {
    NOT_STARTED: { color: 'bg-gray-700 text-gray-400',           icon: Circle,      label: 'Not started' },
    PENDING:     { color: 'bg-amber-900/40 text-amber-300',      icon: Clock,       label: 'Pending'     },
    APPROVED:    { color: 'bg-green-900/40 text-green-300',      icon: CheckCircle, label: 'Approved'    },
    REJECTED:    { color: 'bg-red-900/40 text-red-300',          icon: XCircle,     label: 'Rejected'    },
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
  { key: 'paymentStep',   icon: CreditCard,  label: 'Payment'   },
  { key: 'propertyStep',  icon: Home,        label: 'Property'  },
  { key: 'otaStep',       icon: Link,        label: 'OTA'       },
  { key: 'calendarStep',  icon: Calendar,    label: 'Calendar'  },
  { key: 'domainStep',    icon: Globe,       label: 'Domain'    },
  { key: 'adminStep',     icon: BadgeCheck,  label: 'Admin'     },
]

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
  const identityData = v.identityStep?.data ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Host Verification Review</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">Org: {v.organizationId}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${v.progressPercent}%` }} />
              </div>
              <span className={`text-sm font-bold ${v.bookingsEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                {v.progressPercent}%
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-700">
          {(['overview', 'documents', 'approve'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="space-y-2">
              {STEPS.map(s => {
                const step = (v as any)[s.key]
                if (!step?.enabled) return null
                const Icon = s.icon
                return (
                  <div key={s.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-gray-700/30">
                    <Icon size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-300 w-24 flex-shrink-0">{s.label}</span>
                    <StatusChip status={step.status} />
                    {step.submittedAt && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(step.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                    {step.status === 'PENDING' && (
                      <div className={`${step.submittedAt ? '' : 'ml-auto'} flex gap-1`}>
                        <button
                          onClick={() => stepApproveMut.mutate({ step: s.key.replace('Step', ''), approved: true })}
                          disabled={stepApproveMut.isPending}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-800/40 border border-green-700/40 text-green-300 hover:bg-green-800/60 flex items-center gap-1 transition-colors disabled:opacity-40">
                          <ThumbsUp size={10} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            const r = window.prompt('Rejection reason:')
                            if (r !== null) stepApproveMut.mutate({ step: s.key.replace('Step', ''), approved: false, r })
                          }}
                          disabled={stepApproveMut.isPending}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-900/50 flex items-center gap-1 transition-colors disabled:opacity-40">
                          <ThumbsDown size={10} /> Reject
                        </button>
                      </div>
                    )}
                    {step.rejectionReason && (
                      <span className="text-xs text-red-400 ml-auto">Reason: {step.rejectionReason}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Documents tab */}
          {tab === 'documents' && (
            <div className="space-y-5">
              {/* Identity docs */}
              {identityData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} /> Identity Documents
                  </h3>
                  {[{ label: 'ID Document', url: identityData[0] }, { label: 'Selfie', url: identityData[1] }]
                    .filter(d => d.url)
                    .map((d, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-700/40 rounded-lg mb-1.5">
                        <FileText size={13} className="text-gray-400" />
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 truncate">
                          {d.label} <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                </div>
              )}

              {/* Property docs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Home size={14} /> Property Documents
                </h3>
                {propertyData[0] && <p className="text-xs text-gray-500 mb-2">Address: {propertyData[0]}</p>}
                {[
                  { label: 'Ownership Proof', url: propertyData[1] },
                  { label: 'Management Auth', url: propertyData[2] },
                  { label: 'Utility Bill',    url: propertyData[3] },
                ].filter(d => d.url).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-700/40 rounded-lg mb-1.5">
                    <FileText size={13} className="text-gray-400" />
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 truncate">
                      {d.label} <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>

              {/* OTA listings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Link size={14} /> OTA Listings
                </h3>
                {[
                  { label: 'Airbnb',       url: otaData[0] },
                  { label: 'Booking.com',  url: otaData[1] },
                ].filter(d => d.url).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-700/40 rounded-lg mb-1.5">
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                      {d.label} listing <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
                {otaData[2] && <p className="text-xs text-gray-500 mt-1">Auto-check note: {otaData[2]}</p>}
              </div>

              {/* Payment */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <CreditCard size={14} /> Payment Account
                </h3>
                {paymentData[0] && (
                  <p className="text-xs text-gray-300 bg-gray-700/40 p-2.5 rounded-lg">
                    Stripe: <span className="font-mono">{paymentData[0]}</span>
                    {' '}· charges {paymentData[1] === 'true' ? '✅' : '❌'}
                    {' '}· payouts {paymentData[2] === 'true' ? '✅' : '❌'}
                  </p>
                )}
                {paymentData[3] && (
                  <p className="text-xs text-gray-300 bg-gray-700/40 p-2.5 rounded-lg mt-1.5">
                    PayPal: <span className="font-mono">{paymentData[3]}</span>
                  </p>
                )}
              </div>

              {/* Domain */}
              {domainData[0] && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <Globe size={14} /> Domain
                  </h3>
                  <p className="text-xs text-gray-300 bg-gray-700/40 p-2.5 rounded-lg font-mono">{domainData[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Approve/Reject tab */}
          {tab === 'approve' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Internal notes about this host…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Rejection reason <span className="text-gray-500">(required if rejecting)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full h-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Reason for rejection — this will be sent to the host…"
                />
              </div>

              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 text-sm text-amber-300">
                <strong>Before approving:</strong> Ensure property documents are authentic, OTA listing has sufficient reviews, and payment is fully connected.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => approveMut.mutate(true)}
                  disabled={approveMut.isPending}
                  className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
                  {approveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                  Approve Host
                </button>
                <button
                  onClick={() => approveMut.mutate(false)}
                  disabled={approveMut.isPending || !reason}
                  className="flex-1 py-3 rounded-xl bg-red-900/40 border border-red-700/40 text-red-300 hover:bg-red-900/60 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
                  {approveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                  Reject Host
                </button>
              </div>
              {!reason && <p className="text-xs text-red-400 text-center">Enter a rejection reason before rejecting</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminVerificationsPage() {
  const [filter, setFilter]   = useState<'pending' | 'all'>('pending')
  const [selected, setSelected] = useState<VerificationProgress | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', filter],
    queryFn:  () => filter === 'pending' ? verificationApi.listPending() : verificationApi.listAll(),
    refetchInterval: 30_000,
  })

  const items = data?.content ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Verifications</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {items.length} {filter === 'pending' ? 'pending' : 'total'}
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-700/50 rounded-xl border border-gray-700">
          {(['pending', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:text-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-amber-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-400">No {filter === 'pending' ? 'pending' : ''} verifications</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Org ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Property</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">OTA</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {items.map(v => (
                <tr key={v.organizationId} className="hover:bg-gray-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-400">{v.organizationId.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${v.progressPercent}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{v.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusChip status={v.identityStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.propertyStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.otaStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.paymentStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3"><StatusChip status={v.adminStep?.status ?? 'NOT_STARTED'} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(v)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 flex items-center gap-1.5 transition-colors">
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
