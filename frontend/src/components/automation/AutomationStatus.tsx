import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, ZapOff, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { automationApi } from '@/api/automation'
import { useAuthStore } from '@/store/authStore'

export function AutomationStatus() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [understood, setUnderstood] = useState(false)

  const { data: status, isLoading } = useQuery({
    queryKey: ['automation-status', orgId],
    queryFn: () => automationApi.getStatus(orgId!),
    enabled: !!orgId,
    refetchInterval: 30000,
  })

  const enableMutation = useMutation({
    mutationFn: () => automationApi.enable(orgId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['automation-status', orgId], data)
      queryClient.invalidateQueries({ queryKey: ['automation-status', orgId] })
      setShowEnableModal(false)
      setUnderstood(false)
      toast.success('Automation enabled — codes will be generated automatically.')
    },
    onError: () => toast.error('Failed to enable automation'),
  })

  const disableMutation = useMutation({
    mutationFn: () => automationApi.disable(orgId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['automation-status', orgId], data)
      setShowDisableModal(false)
      toast.success('Automation disabled.')
    },
    onError: () => toast.error('Failed to disable automation'),
  })

  if (isLoading || !status) return null

  const isEnabled = status.enabled

  return (
    <>
      {/* Status bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
        isEnabled
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isEnabled ? 'bg-emerald-500' : 'bg-red-500'} ${isEnabled ? 'animate-pulse' : ''}`} />
          {isEnabled ? (
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Automatic Code Generation is Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ZapOff size={15} className="text-red-500" />
              <span className="text-sm font-medium text-red-800">Automatic Code Generation is Disabled</span>
            </div>
          )}
        </div>

        <button
          onClick={() => isEnabled ? setShowDisableModal(true) : setShowEnableModal(true)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            isEnabled
              ? 'text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
          }`}
        >
          {isEnabled ? 'Disable Automation' : 'Enable Automation'}
        </button>
      </div>

      {/* Enable Modal */}
      {showEnableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Enable Automatic Code Generation</h2>
              </div>
            </div>

            <div className="px-7 py-6 space-y-5">
              {/* Explanation */}
              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>
                  You are about to enable automatic scheduling and code generation.
                </p>
                <p>
                  Once enabled, the system will automatically generate access codes for your reservations.
                </p>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <p className="text-xs">
                    <strong>Guests will NOT receive the codes automatically.</strong> Propvian will notify
                    you before each guest arrives and provide the generated access code. You simply need
                    to copy and send the code manually to the guest via Airbnb chat, WhatsApp, SMS, or email.
                    We intentionally do not contact guests directly because we do not have their contact information.
                  </p>
                </div>
              </div>

              {/* Pending count */}
              <div className={`rounded-xl border p-4 ${
                status.pendingReservationCount > 0
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {status.pendingReservationCount > 0 ? (
                  <p className="text-sm font-medium text-primary-800">
                    <strong>{status.pendingReservationCount}</strong> upcoming {status.pendingReservationCount === 1 ? 'reservation' : 'reservations'} will be processed immediately and door codes generated.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    No upcoming reservations found. The automation job will still be activated and will process future reservations automatically.
                  </p>
                )}
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    understood ? 'bg-primary-600 border-primary-600' : 'border-gray-300 group-hover:border-primary-400'
                  }`}>
                    {understood && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 leading-snug">
                  I understand that codes are generated automatically, guests are <strong>not</strong> contacted automatically, and I will manually share the code with each guest.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-7 pb-6">
              <button
                onClick={() => { setShowEnableModal(false); setUnderstood(false) }}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => enableMutation.mutate()}
                disabled={!understood || enableMutation.isPending}
                className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50"
              >
                {enableMutation.isPending ? (
                  <><Loader2 size={15} className="animate-spin" /> Enabling…</>
                ) : (
                  <><Zap size={15} /> Enable Automation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-7">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <ZapOff size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Disable Automation?</h3>
            <p className="text-sm text-gray-600 mb-6">
              The background scheduling job will stop. No new access codes will be generated automatically. You can re-enable this at any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDisableModal(false)} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
              <button
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
                className="btn-danger flex-1 justify-center py-2.5"
              >
                {disableMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
