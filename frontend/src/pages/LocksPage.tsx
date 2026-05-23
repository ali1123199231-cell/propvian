import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Lock, RefreshCw, Unlink, Battery, Wifi, WifiOff, AlertCircle,
  ExternalLink, Trash2, ChevronRight, CheckCircle2, XCircle,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { locksApi, type OAuthLockItem } from '@/api/locks'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { LockStatusBadge } from '@/components/ui/Badge'
import type { Lock as LockType } from '@/types'

function LockStatusIcon({ status }: { status: string }) {
  if (status === 'CONNECTED') return <Wifi size={16} className="text-emerald-500" />
  if (status === 'DISCONNECTED') return <WifiOff size={16} className="text-gray-400" />
  if (status === 'ERROR') return <AlertCircle size={16} className="text-red-500" />
  return <RefreshCw size={16} className="text-amber-500 animate-spin" />
}

function LockCard({ lock, onSync, onDisconnect, onDelete, syncing }: {
  lock: LockType
  onSync: () => void
  onDisconnect: () => void
  onDelete: () => void
  syncing: boolean
}) {
  return (
    <div className="card p-5 space-y-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Lock size={18} className="text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{lock.name || lock.ttlockLockAlias || `Lock ${lock.ttlockLockId}`}</h3>
            <p className="text-xs text-gray-500">TTLock ID: {lock.ttlockLockId}</p>
          </div>
        </div>
        <LockStatusIcon status={lock.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <LockStatusBadge status={lock.status} />
        {lock.batteryLevel != null && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Battery size={14} className={lock.batteryLevel < 20 ? 'text-red-500' : 'text-gray-400'} />
            <span className={lock.batteryLevel < 20 ? 'text-red-500 font-medium' : ''}>{lock.batteryLevel}%</span>
          </div>
        )}
      </div>

      {lock.lastSyncAt && (
        <p className="text-xs text-gray-400">
          Synced {formatDistanceToNow(parseISO(lock.lastSyncAt), { addSuffix: true })}
        </p>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-200">
        <button
          onClick={onSync}
          disabled={syncing}
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          Sync
        </button>
        <button
          onClick={onDisconnect}
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 text-amber-600 hover:text-amber-700 hover:border-amber-300"
        >
          <Unlink size={13} />
          Disconnect
        </button>
        <button
          onClick={onDelete}
          className="btn-secondary flex items-center justify-center gap-1.5 text-sm py-1.5 px-3 text-red-600 hover:text-red-700 hover:border-red-300"
          title="Remove lock from app"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export function LocksPage() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const orgId = activeOrg?.id

  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [disconnectTarget, setDisconnectTarget] = useState<LockType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LockType | null>(null)

  // OAuth post-redirect state
  const ttlockState = searchParams.get('ttlock_state')
  const ttlockError = searchParams.get('ttlock_error')
  const [showLockPicker, setShowLockPicker] = useState(false)
  const [selectedOAuthLock, setSelectedOAuthLock] = useState<OAuthLockItem | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [customName, setCustomName] = useState('')
  const [popupOpened, setPopupOpened] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId, 0],
    queryFn: () => propertiesApi.list(orgId!, 0, 100),
    enabled: !!orgId,
  })
  const properties = propsData?.content ?? []

  const locksQuery = useQuery({
    queryKey: ['all-locks', orgId],
    queryFn: async () => {
      const allLocks: LockType[] = []
      for (const p of properties) {
        const locks = await locksApi.listByProperty(p.id)
        allLocks.push(...locks)
      }
      return allLocks
    },
    enabled: properties.length > 0,
  })

  const oauthLocksQuery = useQuery({
    queryKey: ['oauth-locks', ttlockState],
    queryFn: () => locksApi.getOAuthLocks(ttlockState!),
    enabled: !!ttlockState,
    retry: false,
  })

  // If this page loaded inside the OAuth popup, relay state to parent and close
  useEffect(() => {
    if (!window.opener) return
    if (ttlockState) {
      window.opener.postMessage({ type: 'ttlock-oauth-success', state: ttlockState }, window.location.origin)
      window.close()
    } else if (ttlockError) {
      window.opener.postMessage({ type: 'ttlock-oauth-error', error: ttlockError }, window.location.origin)
      window.close()
    }
  }, [ttlockState, ttlockError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show lock picker when OAuth redirected back (full-page fallback or postMessage)
  useEffect(() => {
    if (window.opener) return  // handled above — don't act inside the popup itself
    if (ttlockState && !ttlockError) {
      setShowLockPicker(true)
    }
    if (ttlockError) {
      const msg = ttlockError === 'expired'
        ? 'Authorization session expired. Please try again.'
        : 'TTLock authorization failed. Please try again.'
      toast.error(msg)
      setSearchParams({}, { replace: true })
    }
  }, [ttlockState, ttlockError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for postMessage from the OAuth popup
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'ttlock-oauth-success') {
        setPopupOpened(false)
        popupRef.current = null
        setSearchParams({ ttlock_state: event.data.state }, { replace: true })
      } else if (event.data?.type === 'ttlock-oauth-error') {
        setPopupOpened(false)
        popupRef.current = null
        const msg = event.data.error === 'expired'
          ? 'Authorization session expired. Please try again.'
          : 'TTLock authorization failed. Please try again.'
        toast.error(msg)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [setSearchParams])

  const startOAuthMutation = useMutation({
    mutationFn: locksApi.startOAuth,
    onSuccess: ({ oauthUrl }) => {
      const w = 620, h = 700
      const left = Math.round((window.screen.width - w) / 2)
      const top = Math.round((window.screen.height - h) / 2)
      const popup = window.open(
        oauthUrl,
        'ttlock-oauth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      )
      if (!popup || popup.closed) {
        setPopupBlocked(true)
        setPopupOpened(false)
        toast.error('Popup was blocked by your browser. Please allow popups for this site and try again, or click the button to open in this tab.')
      } else {
        popupRef.current = popup
        setPopupOpened(true)
        setPopupBlocked(false)
        popup.focus()
      }
    },
    onError: () => toast.error('Failed to start TTLock authorization'),
  })

  const connectMutation = useMutation({
    mutationFn: () => locksApi.connect(selectedPropertyId, {
      oauthState: ttlockState!,
      ttlockLockId: selectedOAuthLock!.lockId,
      name: customName || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-locks', orgId] })
      toast.success('Lock connected successfully')
      setShowLockPicker(false)
      setSelectedOAuthLock(null)
      setSelectedPropertyId('')
      setCustomName('')
      setSearchParams({}, { replace: true })
    },
    onError: () => toast.error('Failed to connect lock'),
  })

  const syncMutation = useMutation({
    mutationFn: (lockId: string) => locksApi.sync(lockId),
    onMutate: (lockId) => setSyncingId(lockId),
    onSettled: () => setSyncingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-locks', orgId] })
      toast.success('Lock synced')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: () => locksApi.disconnect(disconnectTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-locks', orgId] })
      toast.success('Lock disconnected')
      setDisconnectTarget(null)
    },
    onError: () => toast.error('Failed to disconnect lock'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => locksApi.delete(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-locks', orgId] })
      toast.success('Lock removed from app')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to remove lock'),
  })

  const locks = locksQuery.data ?? []
  const oauthLocks = oauthLocksQuery.data ?? []

  return (
    <div>
      <TopBar
        title="Locks"
        action={{
          label: startOAuthMutation.isPending ? 'Opening…' : 'Connect with TTLock',
          onClick: () => startOAuthMutation.mutate(),
        }}
      />
      <div className="p-6">
        {/* Popup status banner */}
        {popupOpened && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <ExternalLink size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-medium">A TTLock authorization window has opened.</p>
              <p className="mt-0.5 text-blue-700">Complete the login in that window. If you don't see it, your browser may have blocked the popup — check the address bar for a blocked-popup icon and allow it, then try again.</p>
              <button
                onClick={() => popupRef.current?.focus()}
                className="mt-1.5 text-blue-600 underline hover:text-blue-800"
              >
                Click here to bring it to the front
              </button>
            </div>
          </div>
        )}
        {popupBlocked && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p>
              Your browser blocked the popup. Allow popups for this site and click <strong>Connect with TTLock</strong> again.
            </p>
          </div>
        )}
        {locksQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 h-48 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : locks.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No locks connected"
            description="Connect your TTLock smart locks to automate guest access. You'll be redirected to TTLock to authorize — no password needed here."
            action={{
              label: startOAuthMutation.isPending ? 'Redirecting to TTLock...' : 'Connect with TTLock',
              onClick: () => startOAuthMutation.mutate(),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locks.map(lock => (
              <LockCard
                key={lock.id}
                lock={lock}
                syncing={syncingId === lock.id}
                onSync={() => syncMutation.mutate(lock.id)}
                onDisconnect={() => setDisconnectTarget(lock)}
                onDelete={() => setDeleteTarget(lock)}
              />
            ))}
          </div>
        )}
      </div>

      {/* TTLock OAuth Lock Picker */}
      <Modal
        isOpen={showLockPicker}
        onClose={() => {
          setShowLockPicker(false)
          setSearchParams({}, { replace: true })
        }}
        title="Select a Lock to Connect"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            TTLock account authorized. Select a lock and assign it to a property.
          </div>

          {oauthLocksQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : oauthLocksQuery.isError ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle size={16} className="flex-shrink-0" />
              Failed to load locks. The session may have expired.
            </div>
          ) : oauthLocks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No locks found in this TTLock account.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Your TTLock devices</p>
              {oauthLocks.map(l => (
                <button
                  key={l.lockId}
                  onClick={() => setSelectedOAuthLock(l)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedOAuthLock?.lockId === l.lockId
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Lock size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{l.lockAlias || l.lockName || `Lock ${l.lockId}`}</p>
                    <p className="text-xs text-gray-400">ID: {l.lockId}{l.electricQuantity != null ? ` · Battery: ${l.electricQuantity}%` : ''}</p>
                  </div>
                  {selectedOAuthLock?.lockId === l.lockId && (
                    <CheckCircle2 size={16} className="text-primary-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedOAuthLock && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Property *</label>
                <select
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="input-base w-full"
                >
                  <option value="">Select property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder={selectedOAuthLock.lockAlias || `Lock ${selectedOAuthLock.lockId}`}
                  className="input-base w-full"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowLockPicker(false)
                setSearchParams({}, { replace: true })
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => connectMutation.mutate()}
              disabled={!selectedOAuthLock || !selectedPropertyId || connectMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {connectMutation.isPending ? 'Connecting...' : (
                <>Connect Lock <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Disconnect confirmation */}
      <Modal isOpen={!!disconnectTarget} onClose={() => setDisconnectTarget(null)} title="Disconnect Lock" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Disconnect <span className="font-medium text-gray-900">{disconnectTarget?.name || `Lock ${disconnectTarget?.ttlockLockId}`}</span>?
            The lock will remain in your app but lose its active connection. Access codes may stop working.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDisconnectTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="btn-primary bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Lock" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Permanently remove <span className="font-medium text-gray-900">{deleteTarget?.name || `Lock ${deleteTarget?.ttlockLockId}`}</span> from your app?
            This will delete all associated access codes and cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger"
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove Lock'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
