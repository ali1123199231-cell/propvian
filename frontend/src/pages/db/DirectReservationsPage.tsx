import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Search, Loader2, XCircle, CheckCircle, Plus, X, DollarSign, Users, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { directBookingApi } from '@/api/directBooking'
import { propertiesApi } from '@/api/properties'
import { reservationsApi } from '@/api/reservations'
import { useAuthStore } from '@/store/authStore'
import type { DirectBooking, DirectBookingStatus, Reservation } from '@/types'

// ── New Booking Modal ────────────────────────────────────────────────────────

const newBookingSchema = z.object({
  propertyId:     z.string().min(1, 'Select a property'),
  guestName:      z.string().min(2, 'Required'),
  guestEmail:     z.string().email('Valid email required'),
  guestPhone:     z.string().optional(),
  numberOfGuests: z.coerce.number().int().min(1, 'At least 1 guest'),
  checkInDate:    z.string().min(1, 'Required'),
  checkOutDate:   z.string().min(1, 'Required'),
  totalAmount:    z.coerce.number().min(0).optional().or(z.literal('')),
  notes:          z.string().optional(),
})
type NewBookingForm = z.infer<typeof newBookingSchema>

function NewBookingModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()

  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId],
    queryFn:  () => propertiesApi.list(orgId, 0, 100),
    enabled:  !!orgId,
  })
  const properties = propsData?.content ?? []

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewBookingForm>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: { numberOfGuests: 1 },
  })

  const createMut = useMutation({
    mutationFn: (d: NewBookingForm) => directBookingApi.create(orgId, {
      propertyId:     d.propertyId,
      guestName:      d.guestName,
      guestEmail:     d.guestEmail,
      guestPhone:     d.guestPhone || undefined,
      numberOfGuests: d.numberOfGuests,
      checkInDate:    d.checkInDate,
      checkOutDate:   d.checkOutDate,
      totalAmount:    d.totalAmount ? Number(d.totalAmount) : undefined,
      notes:          d.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direct-bookings', orgId] })
      toast.success('Booking created!')
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error creating booking'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => createMut.mutate(d))}>
          <div className="p-6 space-y-4">
            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property *</label>
              <select {...register('propertyId')} className="input-base appearance-none">
                <option value="">Select property…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
            </div>

            {/* Guest info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Guest name *</label>
                <input {...register('guestName')} className="input-base" placeholder="Jane Smith" />
                {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Guest email *</label>
                <input {...register('guestEmail')} type="email" className="input-base" placeholder="jane@example.com" />
                {errors.guestEmail && <p className="mt-1 text-xs text-red-500">{errors.guestEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                <input {...register('guestPhone')} className="input-base" placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of guests *</label>
                <div className="relative">
                  <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input {...register('numberOfGuests')} type="number" min="1" className="input-base pl-8" placeholder="2" />
                </div>
                {errors.numberOfGuests && <p className="mt-1 text-xs text-red-500">{errors.numberOfGuests.message}</p>}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in *</label>
                <input {...register('checkInDate')} type="date" className="input-base" />
                {errors.checkInDate && <p className="mt-1 text-xs text-red-500">{errors.checkInDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out *</label>
                <input {...register('checkOutDate')} type="date" className="input-base" />
                {errors.checkOutDate && <p className="mt-1 text-xs text-red-500">{errors.checkOutDate.message}</p>}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total amount ($)</label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('totalAmount')} type="number" min="0" step="0.01" className="input-base pl-8" placeholder="500.00" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea {...register('notes')} rows={2} className="input-base resize-none"
                placeholder="Special requests, early check-in, etc." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || createMut.isPending} className="btn-primary py-2 px-5 text-sm">
              {(isSubmitting || createMut.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {(isSubmitting || createMut.isPending) ? 'Creating…' : 'Create booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<DirectBookingStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pending payment', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED:       { label: 'Confirmed',        color: 'bg-green-100 text-green-700' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-red-100 text-red-700' },
  CHECKED_IN:      { label: 'Checked in',       color: 'bg-blue-100 text-blue-700' },
  CHECKED_OUT:     { label: 'Checked out',      color: 'bg-gray-100 text-gray-600' },
}

function BookingRow({ booking, orgId }: { booking: DirectBooking; orgId: string }) {
  const qc  = useQueryClient()
  const s   = STATUS_LABELS[booking.status]

  const confirmMut = useMutation({
    mutationFn: () => directBookingApi.confirm(orgId, booking.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['direct-bookings', orgId] }); toast.success('Booking confirmed') },
    onError:    (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })
  const cancelMut = useMutation({
    mutationFn: () => directBookingApi.cancel(orgId, booking.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['direct-bookings', orgId] }); toast.success('Booking cancelled') },
    onError:    (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-700">
            {booking.guestName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{booking.guestName}</p>
            <p className="text-xs text-gray-400">{booking.guestEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {booking.checkInDate} → {booking.checkOutDate}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {booking.totalAmount != null ? `$${booking.totalAmount}` : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {booking.status === 'PENDING_PAYMENT' && (
            <button
              onClick={() => confirmMut.mutate()}
              disabled={confirmMut.isPending}
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="Confirm"
            >
              {confirmMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            </button>
          )}
          {!['CANCELLED', 'CHECKED_OUT'].includes(booking.status) && (
            <button
              onClick={() => cancelMut.mutate()}
              disabled={cancelMut.isPending}
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="Cancel"
            >
              {cancelMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Source badge ─────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  AIRBNB:  { label: 'Airbnb',       cls: 'bg-rose-100 text-rose-700' },
  BOOKING: { label: 'Booking.com',  cls: 'bg-blue-100 text-blue-700' },
  VRBO:    { label: 'VRBO',         cls: 'bg-sky-100 text-sky-700' },
  MANUAL:  { label: 'Manual',       cls: 'bg-gray-100 text-gray-600' },
  OTHER:   { label: 'iCal',         cls: 'bg-violet-100 text-violet-700' },
}

function SyncedReservationRow({ r }: { r: Reservation }) {
  const src = SOURCE_LABELS[r.source] ?? SOURCE_LABELS.OTHER
  const fmtDate = (d: string) => {
    try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
  }
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{r.guestName ?? '—'}</p>
        {r.guestEmail && <p className="text-xs text-gray-400">{r.guestEmail}</p>}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{fmtDate(r.checkInDate)}</p>
        <p className="text-xs text-gray-400">→ {fmtDate(r.checkOutDate)}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${src.cls}`}>
          {src.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          r.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
          r.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {r.status}
        </span>
      </td>
      {r.propertyName && (
        <td className="px-4 py-3 text-sm text-gray-500">{r.propertyName}</td>
      )}
    </tr>
  )
}

function SyncedReservationsTab({ orgId }: { orgId: string }) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['synced-reservations', orgId, page],
    queryFn:  () => reservationsApi.listByOrg(orgId, page, 20),
    enabled:  !!orgId,
  })

  const filtered = (data?.content ?? []).filter(r =>
    !search ||
    (r.guestName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.guestEmail ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search guests…" className="input-base pl-9 py-2 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <RefreshCw size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No synced reservations yet</p>
            <p className="text-xs mt-1 text-gray-400">Add an iCal integration to import reservations from Airbnb, Booking.com, and more</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => <SyncedReservationRow key={r.id} r={r} />)}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first}
            className="btn-secondary disabled:opacity-40 py-1.5 px-3 text-xs">Previous</button>
          <span className="text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={data.last}
            className="btn-secondary disabled:opacity-40 py-1.5 px-3 text-xs">Next</button>
        </div>
      )}
    </div>
  )
}

export function DirectReservationsPage() {
  const { activeOrg } = useAuthStore()
  const orgId         = activeOrg?.id ?? ''
  const [view, setView]               = useState<'direct' | 'synced'>('direct')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(0)
  const [showNew, setShowNew]         = useState(false)
  const [statusFilter, setStatusFilter] = useState<DirectBookingStatus | 'ALL'>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['direct-bookings', orgId, page],
    queryFn:  () => directBookingApi.list(orgId, page, 20),
    enabled:  !!orgId && view === 'direct',
  })

  const filtered = data?.content.filter((b) =>
    (statusFilter === 'ALL' || b.status === statusFilter) &&
    (!search ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestEmail.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 mt-1">Direct bookings and synced iCal reservations</p>
        </div>
        {view === 'direct' && (
          <button onClick={() => setShowNew(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Plus size={15} /> New booking
          </button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setView('direct')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'direct' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Direct Bookings
        </button>
        <button
          onClick={() => setView('synced')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            view === 'synced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RefreshCw size={13} /> Synced (iCal)
        </button>
      </div>

      {view === 'synced' ? (
        <SyncedReservationsTab orgId={orgId} />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {(['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s === 'ALL' ? 'All' : STATUS_LABELS[s as DirectBookingStatus].label}
                {s !== 'ALL' && data && (
                  <span className="ml-1 opacity-70">
                    ({data.content.filter(b => b.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guests…" className="input-base pl-9 py-2 text-sm" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-primary-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Calendar size={32} className="mb-3 opacity-40" />
                <p className="text-sm">No reservations yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => <BookingRow key={b.id} booking={b} orgId={orgId} />)}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first}
                className="btn-secondary disabled:opacity-40 py-1.5 px-3 text-xs">Previous</button>
              <span className="text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.last}
                className="btn-secondary disabled:opacity-40 py-1.5 px-3 text-xs">Next</button>
            </div>
          )}
        </>
      )}

      {showNew && <NewBookingModal orgId={orgId} onClose={() => setShowNew(false)} />}
    </div>
  )
}
