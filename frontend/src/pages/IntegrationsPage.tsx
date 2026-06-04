import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plug, RefreshCw, Trash2, CheckCircle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Copy, Check, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDistanceToNow, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { calendarIntegrationsApi } from '@/api/calendarIntegrations'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CalendarIntegration } from '@/types'

const PLATFORMS = ['AIRBNB', 'BOOKING', 'VRBO', 'OTHER'] as const

const createSchema = z.object({
  propertyId: z.string().uuid('Select a property'),
  platform: z.enum(PLATFORMS),
  icalUrl: z.string().url('Must be a valid URL'),
  displayName: z.string().max(200).optional(),
  syncIntervalMinutes: z.coerce.number().int().min(5).max(1440).optional().or(z.literal('')),
})
type CreateFormData = z.infer<typeof createSchema>

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; howTo: string }> = {
  AIRBNB: {
    label: 'Airbnb',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    howTo: 'In Airbnb: go to your listing → Availability → Sync calendars → Export Calendar. Copy the .ics URL.',
  },
  BOOKING: {
    label: 'Booking.com',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    howTo: 'In Booking.com: go to your property → Calendar → iCal export. Copy the link for your property.',
  },
  VRBO: {
    label: 'VRBO',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    howTo: 'In VRBO: go to Calendar → Import/Export calendar → Export your calendar. Copy the .ics URL.',
  },
  OTHER: {
    label: 'Other iCal',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    howTo: 'Paste any valid .ics URL from a calendar application or booking platform.',
  },
}

function SyncStatusIcon({ status }: { status?: string }) {
  if (status === 'SUCCESS') return <CheckCircle size={14} className="text-emerald-500" />
  if (status === 'FAILED') return <XCircle size={14} className="text-red-500" />
  return <Clock size={14} className="text-gray-400" />
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.OTHER
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  )
}

export function IntegrationsPage() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [showCreate, setShowCreate] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deleteInteg, setDeleteInteg] = useState<CalendarIntegration | null>(null)
  const [showHowTo, setShowHowTo] = useState(false)

  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId, 0],
    queryFn: () => propertiesApi.list(orgId!, 0, 100),
    enabled: !!orgId,
  })
  const properties = propsData?.content ?? []

  const integrationsQuery = useQuery({
    queryKey: ['calendar-integrations', orgId],
    queryFn: async () => {
      const all: CalendarIntegration[] = []
      for (const p of properties) {
        const items = await calendarIntegrationsApi.listByProperty(p.id)
        all.push(...items.map(i => ({ ...i, propertyName: p.name })))
      }
      return all
    },
    enabled: properties.length > 0,
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { platform: 'AIRBNB', syncIntervalMinutes: 15 },
  })

  const selectedPlatform = watch('platform') as string

  const createMutation = useMutation({
    mutationFn: (d: CreateFormData) => calendarIntegrationsApi.create(d.propertyId, {
      platform: d.platform,
      icalUrl: d.icalUrl,
      displayName: d.displayName || undefined,
      syncIntervalMinutes: d.syncIntervalMinutes ? Number(d.syncIntervalMinutes) : 15,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations', orgId] })
      toast.success('Calendar integration added')
      setShowCreate(false)
      reset()
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => calendarIntegrationsApi.sync(id),
    onMutate: (id) => setSyncingId(id),
    onSettled: () => setSyncingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations', orgId] })
      toast.success('Sync triggered')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => calendarIntegrationsApi.delete(deleteInteg!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations', orgId] })
      toast.success('Integration removed')
      setDeleteInteg(null)
    },
    onError: () => toast.error('Failed to remove integration'),
  })

  const integrations = integrationsQuery.data ?? []
  const platformHowTo = PLATFORM_CONFIG[selectedPlatform] ?? PLATFORM_CONFIG.OTHER

  // iCal export feed state per property
  const [exportTokens, setExportTokens] = useState<Record<string, string>>({})
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null)

  const loadToken = async (propertyId: string) => {
    if (exportTokens[propertyId]) return
    try {
      const token = await calendarIntegrationsApi.getExportToken(propertyId)
      setExportTokens(t => ({ ...t, [propertyId]: token }))
    } catch { toast.error('Could not load export token') }
  }

  const rotateTokenMut = useMutation({
    mutationFn: (propertyId: string) => calendarIntegrationsApi.rotateToken(propertyId),
    onSuccess: (token, propertyId) => {
      setExportTokens(t => ({ ...t, [propertyId]: token }))
      toast.success('Feed URL regenerated')
    },
  })

  const copyFeedUrl = (propertyId: string) => {
    const token = exportTokens[propertyId]
    if (!token) return
    const url = `${window.location.origin}/api/public/calendar/${token}/calendar.ics`
    navigator.clipboard.writeText(url)
    setCopiedPropId(propertyId)
    setTimeout(() => setCopiedPropId(null), 2000)
  }

  return (
    <div>
      <TopBar
        title="Calendar Integrations"
        action={{ label: 'Add Integration', onClick: () => setShowCreate(true) }}
      />
      <div className="p-6 space-y-6">
        {/* Platform overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PLATFORMS.map(platform => {
            const cfg = PLATFORM_CONFIG[platform]
            const count = integrations.filter(i => i.platform === platform).length
            return (
              <div
                key={platform}
                className={`card p-4 border-2 ${count > 0 ? cfg.border : 'border-transparent'} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => setShowCreate(true)}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${cfg.bg}`}>
                  <Plug size={18} className={cfg.text} />
                </div>
                <p className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{count > 0 ? `${count} connected` : 'Not connected'}</p>
              </div>
            )
          })}
        </div>

        {/* Integration list */}
        {integrationsQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
          </div>
        ) : integrations.length === 0 ? (
          <EmptyState
            icon={Plug}
            title="No calendar integrations yet"
            description="Connect your Airbnb, Booking.com, or VRBO iCal feed to automatically sync reservations and generate guest access codes."
            action={{ label: 'Add Integration', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Connected Calendars ({integrations.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {integrations.map(integ => (
                <div key={integ.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <PlatformBadge platform={integ.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {integ.displayName || integ.icalUrl}
                      </p>
                      <SyncStatusIcon status={integ.lastSyncStatus} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span>{(integ as any).propertyName}</span>
                      {integ.lastSyncAt && (
                        <span>Synced {formatDistanceToNow(parseISO(integ.lastSyncAt), { addSuffix: true })}</span>
                      )}
                      {integ.reservationsSynced != null && (
                        <span>{integ.reservationsSynced} reservations</span>
                      )}
                    </div>
                    {integ.lastSyncError && (
                      <p className="text-xs text-red-500 mt-1 truncate">{integ.lastSyncError}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${integ.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {integ.enabled ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => syncMutation.mutate(integ.id)}
                      disabled={syncingId === integ.id}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Sync now"
                    >
                      <RefreshCw size={15} className={syncingId === integ.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => setDeleteInteg(integ)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* iCal Export Feeds */}
        {properties.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Your Calendar Feeds</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Subscribe to these URLs in Google Calendar, Apple Calendar, Outlook, Airbnb, or Booking.com to export your Propvian bookings.
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {properties.map(p => {
                const token = exportTokens[p.id]
                const feedUrl = token
                  ? `${window.location.origin}/api/public/calendar/${token}/calendar.ics`
                  : null
                return (
                  <div key={p.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      {token && (
                        <button
                          onClick={() => rotateTokenMut.mutate(p.id)}
                          disabled={rotateTokenMut.isPending}
                          title="Regenerate URL (invalidates old link)"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600 transition-colors"
                        >
                          <RotateCcw size={12} className={rotateTokenMut.isPending ? 'animate-spin' : ''} />
                          Regenerate
                        </button>
                      )}
                    </div>
                    {token ? (
                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <code className="flex-1 text-xs text-gray-600 truncate">{feedUrl}</code>
                        <button
                          onClick={() => copyFeedUrl(p.id)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 flex-shrink-0 transition-colors"
                        >
                          {copiedPropId === p.id ? <Check size={13} /> : <Copy size={13} />}
                          {copiedPropId === p.id ? 'Copied' : 'Copy'}
                        </button>
                        <a href={feedUrl!} target="_blank" rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary-600 flex-shrink-0 transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => loadToken(p.id)}
                        className="text-xs text-primary-600 hover:text-primary-800 underline"
                      >
                        Generate feed URL
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setShowHowTo(false) }} title="Add Calendar Integration" size="md">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          {/* Platform selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(p => {
                const cfg = PLATFORM_CONFIG[p]
                const isSelected = selectedPlatform === p
                return (
                  <label
                    key={p}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? `${cfg.border} ${cfg.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input type="radio" {...register('platform')} value={p} className="sr-only" />
                    <span className={`text-sm font-medium ${isSelected ? cfg.text : 'text-gray-700'}`}>{cfg.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* How to get the URL */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHowTo(!showHowTo)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} />
                How to get your iCal URL from {platformHowTo.label}
              </span>
              {showHowTo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHowTo && (
              <div className="px-3 pb-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
                {platformHowTo.howTo}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
            <select {...register('propertyId')} className="input-base w-full">
              <option value="">Select property...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">iCal URL *</label>
            <input {...register('icalUrl')} className="input-base w-full" placeholder="https://www.airbnb.com/calendar/ical/..." />
            {errors.icalUrl && <p className="text-red-500 text-xs mt-1">{errors.icalUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input {...register('displayName')} className="input-base w-full" placeholder="Airbnb Beach House" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (min)</label>
              <input {...register('syncIntervalMinutes')} type="number" className="input-base w-full" placeholder="15" />
              {errors.syncIntervalMinutes && <p className="text-red-500 text-xs mt-1">{errors.syncIntervalMinutes.message}</p>}
            </div>
          </div>

          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
            Reservations sync automatically every {watch('syncIntervalMinutes') || 15} minutes. Guest access codes are generated before check-in based on your Access Settings.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Integration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteInteg} onClose={() => setDeleteInteg(null)} title="Remove Integration" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Remove the <span className="text-gray-900 font-medium">{deleteInteg?.platform}</span> calendar integration?
            Future syncs will stop but existing reservations are not affected.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteInteg(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-danger">
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
