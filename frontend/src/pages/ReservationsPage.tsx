import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, Search, LogOut, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { reservationsApi } from '@/api/reservations'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ReservationStatusBadge, SourceBadge } from '@/components/ui/Badge'
import type { Reservation } from '@/types'

const createSchema = z.object({
  propertyId: z.string().uuid('Select a property'),
  checkInDate: z.string().min(1, 'Required'),
  checkOutDate: z.string().min(1, 'Required'),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
  guestPhone: z.string().optional(),
  numberOfGuests: z.coerce.number().int().positive().optional().or(z.literal('')),
  notes: z.string().optional(),
  timezone: z.string().optional(),
})
type CreateFormData = z.infer<typeof createSchema>

export function ReservationsPage() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [detailRes, setDetailRes] = useState<Reservation | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', orgId, page],
    queryFn: () => reservationsApi.listByOrg(orgId!, page, 20),
    enabled: !!orgId,
  })

  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId, 0],
    queryFn: () => propertiesApi.list(orgId!, 0, 100),
    enabled: !!orgId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  })

  const createMutation = useMutation({
    mutationFn: (d: CreateFormData) => reservationsApi.create(d.propertyId, {
      checkInDate: new Date(d.checkInDate).toISOString(),
      checkOutDate: new Date(d.checkOutDate).toISOString(),
      guestName: d.guestName || undefined,
      guestEmail: d.guestEmail || undefined,
      guestPhone: d.guestPhone || undefined,
      numberOfGuests: d.numberOfGuests ? Number(d.numberOfGuests) : undefined,
      notes: d.notes || undefined,
      timezone: d.timezone || 'UTC',
      source: 'MANUAL',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', orgId] })
      toast.success('Reservation created')
      setShowCreate(false)
      reset()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', orgId] })
      toast.success('Reservation cancelled')
      setDetailRes(null)
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.checkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', orgId] })
      toast.success('Guest checked out')
      setDetailRes(null)
    },
  })

  const reservations = (data?.content ?? []).filter(r =>
    !search || r.guestName?.toLowerCase().includes(search.toLowerCase()) ||
    r.guestEmail?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <TopBar
        title="Reservations"
        action={{ label: 'Add Reservation', onClick: () => setShowCreate(true) }}
      />
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by guest name or email..."
            className="input-base w-full pl-9"
          />
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={5} /></div>
          ) : reservations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No reservations"
              description="Create a manual reservation or sync from a calendar integration."
              action={{ label: 'Add Reservation', onClick: () => setShowCreate(true) }}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Guest</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Property</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Dates</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Source</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setDetailRes(r)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{r.guestName || 'Unknown Guest'}</p>
                      <p className="text-xs text-gray-500">{r.guestEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.propertyName ?? '—'}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{format(parseISO(r.checkInDate), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(r.checkOutDate), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4"><SourceBadge source={r.source} /></td>
                    <td className="px-6 py-4"><ReservationStatusBadge status={r.status} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.hasAccessCode ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.hasAccessCode ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1} of {data?.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1) - 1} className="btn-secondary disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Reservation" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
            <select {...register('propertyId')} className="input-base w-full">
              <option value="">Select property...</option>
              {(propsData?.content ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in *</label>
              <input {...register('checkInDate')} type="datetime-local" className="input-base w-full" />
              {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out *</label>
              <input {...register('checkOutDate')} type="datetime-local" className="input-base w-full" />
              {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
              <input {...register('guestName')} className="input-base w-full" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Email</label>
              <input {...register('guestEmail')} type="email" className="input-base w-full" placeholder="guest@example.com" />
              {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('guestPhone')} className="input-base w-full" placeholder="+1 555 0100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <input {...register('numberOfGuests')} type="number" className="input-base w-full" placeholder="2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input {...register('timezone')} className="input-base w-full" placeholder="America/New_York" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="input-base w-full resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!detailRes} onClose={() => setDetailRes(null)} title="Reservation Details" size="md">
        {detailRes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Guest</p>
                <p className="text-gray-900 font-medium">{detailRes.guestName || 'Unknown'}</p>
                <p className="text-gray-600">{detailRes.guestEmail}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <div className="mt-1"><ReservationStatusBadge status={detailRes.status} /></div>
              </div>
              <div>
                <p className="text-gray-500">Check-in</p>
                <p className="text-gray-900">{format(parseISO(detailRes.checkInDate), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-out</p>
                <p className="text-gray-900">{format(parseISO(detailRes.checkOutDate), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <div className="mt-1"><SourceBadge source={detailRes.source} /></div>
              </div>
              <div>
                <p className="text-gray-500">Access Code</p>
                <p className={detailRes.hasAccessCode ? 'text-emerald-600' : 'text-gray-500'}>
                  {detailRes.hasAccessCode ? 'Active' : 'Pending'}
                </p>
              </div>
            </div>
            {detailRes.notes && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{detailRes.notes}</p>
              </div>
            )}
            {(detailRes.status === 'CONFIRMED' || detailRes.status === 'CHECKED_IN') && (
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                {detailRes.status === 'CONFIRMED' && (
                  <button
                    onClick={() => cancelMutation.mutate(detailRes.id)}
                    disabled={cancelMutation.isPending}
                    className="btn-danger flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
                {detailRes.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => checkoutMutation.mutate(detailRes.id)}
                    disabled={checkoutMutation.isPending}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    {checkoutMutation.isPending ? 'Processing...' : 'Check Out'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
