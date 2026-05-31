import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Calendar, DollarSign, Ban,
  Loader2, X, Check, Trash2, Plus, Info,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { directBookingApi } from '@/api/directBooking'
import { availabilityApi, type BlockedDate, type PricingRule } from '@/api/availability'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import type { Property } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}
function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function datesInRange(start: string, end: string): string[] {
  const result: string[] = []
  const cur = parseDate(start)
  const fin = parseDate(end)
  while (cur <= fin) {
    result.push(fmt(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

type DayState = 'available' | 'blocked' | 'booked' | 'today' | 'past'

// ── Modal — Manage a single date or range ────────────────────────────────────

const blockSchema = z.object({
  startDate: z.string().min(1, 'Required'),
  endDate:   z.string().min(1, 'Required'),
  reason:    z.string().optional(),
})
const priceSchema = z.object({
  startDate:    z.string().min(1, 'Required'),
  endDate:      z.string().min(1, 'Required'),
  nightlyRate:  z.coerce.number().min(1, 'Enter a rate'),
  minStayNights:z.coerce.number().min(1).optional(),
  name:         z.string().optional(),
})

type DayModal = { tab: 'block' | 'price'; date: string }

function DayManageModal({
  propertyId, date, onClose,
  blockedDates, pricingRules,
}: {
  propertyId: string
  date: string
  onClose: () => void
  blockedDates: BlockedDate[]
  pricingRules: PricingRule[]
}) {
  const qc  = useQueryClient()
  const [tab, setTab] = useState<'block' | 'price'>('block')

  // Check if this date is already blocked
  const existingBlock = blockedDates.find(b =>
    date >= b.startDate && date <= b.endDate)
  const existingRule = pricingRules.find(r =>
    date >= r.startDate && date <= r.endDate)

  const { register: regBlock, handleSubmit: hsBlock, formState: { errors: blockErr, isSubmitting: blockSub } } = useForm({
    resolver: zodResolver(blockSchema),
    defaultValues: { startDate: date, endDate: date, reason: '' },
  })
  const { register: regPrice, handleSubmit: hsPrice, formState: { errors: priceErr, isSubmitting: priceSub } } = useForm({
    resolver: zodResolver(priceSchema),
    defaultValues: { startDate: date, endDate: date, nightlyRate: '', minStayNights: 1, name: '' },
  })

  const blockMut = useMutation({
    mutationFn: (d: any) => availabilityApi.blockDates(propertyId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocked', propertyId] }); toast.success('Dates blocked'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })
  const unblockMut = useMutation({
    mutationFn: (id: string) => availabilityApi.unblockDate(propertyId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocked', propertyId] }); toast.success('Date unblocked') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })
  const priceMut = useMutation({
    mutationFn: (d: any) => availabilityApi.createPricingRule(propertyId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', propertyId] }); toast.success('Pricing rule saved'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })
  const delPriceMut = useMutation({
    mutationFn: (id: string) => availabilityApi.deletePricingRule(propertyId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', propertyId] }); toast.success('Rule deleted') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Manage {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-gray-100">
          {[{ id: 'block', label: 'Block dates', icon: Ban },
            { id: 'price', label: 'Set pricing', icon: DollarSign }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* BLOCK tab */}
          {tab === 'block' && (
            <div className="space-y-4">
              {existingBlock && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Currently blocked</p>
                    <p className="text-xs text-red-600">{existingBlock.startDate} → {existingBlock.endDate}</p>
                    {existingBlock.reason && <p className="text-xs text-red-500">{existingBlock.reason}</p>}
                  </div>
                  <button onClick={() => unblockMut.mutate(existingBlock.id)}
                    disabled={unblockMut.isPending}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
                    {unblockMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Unblock
                  </button>
                </div>
              )}
              <form onSubmit={hsBlock((d) => blockMut.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                    <input {...regBlock('startDate')} type="date" className="input-base text-sm" />
                    {blockErr.startDate && <p className="text-xs text-red-500 mt-0.5">{blockErr.startDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                    <input {...regBlock('endDate')} type="date" className="input-base text-sm" />
                    {blockErr.endDate && <p className="text-xs text-red-500 mt-0.5">{blockErr.endDate.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
                  <input {...regBlock('reason')} className="input-base text-sm" placeholder="e.g. Owner stay, maintenance…" />
                </div>
                <button type="submit" disabled={blockSub || blockMut.isPending}
                  className="btn-primary w-full justify-center py-2.5">
                  {(blockSub || blockMut.isPending) ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  {(blockSub || blockMut.isPending) ? 'Blocking…' : 'Block these dates'}
                </button>
              </form>
            </div>
          )}

          {/* PRICE tab */}
          {tab === 'price' && (
            <div className="space-y-4">
              {existingRule && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ${existingRule.nightlyRate}/night {existingRule.name ? `— ${existingRule.name}` : ''}
                    </p>
                    <p className="text-xs text-green-600">{existingRule.startDate} → {existingRule.endDate}</p>
                  </div>
                  <button onClick={() => delPriceMut.mutate(existingRule.id)}
                    disabled={delPriceMut.isPending}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                    {delPriceMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              )}
              <form onSubmit={hsPrice((d) => priceMut.mutate(d))} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rule name (optional)</label>
                  <input {...regPrice('name')} className="input-base text-sm" placeholder="e.g. Summer rate, Weekend special…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                    <input {...regPrice('startDate')} type="date" className="input-base text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                    <input {...regPrice('endDate')} type="date" className="input-base text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nightly rate ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input {...regPrice('nightlyRate')} type="number" min="1" className="input-base text-sm pl-6" placeholder="150" />
                    </div>
                    {priceErr.nightlyRate && <p className="text-xs text-red-500 mt-0.5">{priceErr.nightlyRate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min stay (nights)</label>
                    <input {...regPrice('minStayNights')} type="number" min="1" className="input-base text-sm" placeholder="1" />
                  </div>
                </div>
                <button type="submit" disabled={priceSub || priceMut.isPending}
                  className="btn-primary w-full justify-center py-2.5">
                  {(priceSub || priceMut.isPending) ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                  {(priceSub || priceMut.isPending) ? 'Saving…' : 'Save pricing rule'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main calendar page ────────────────────────────────────────────────────────

export function CalendarPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const today = new Date()

  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [selectedProp, setSelectedProp] = useState<string>('')
  const [modal, setModal]       = useState<{ date: string } | null>(null)
  const [selStart, setSelStart] = useState<string | null>(null)
  const [view, setView]         = useState<'calendar' | 'rules'>('calendar')

  // Properties
  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId],
    queryFn:  () => propertiesApi.list(orgId, 0, 100),
    enabled:  !!orgId,
  })
  const properties = propsData?.content ?? []
  const propId = selectedProp || properties[0]?.id || ''
  const property = properties.find(p => p.id === propId)

  // Bookings
  const { data: bookings } = useQuery({
    queryKey: ['direct-bookings', orgId, 'all'],
    queryFn:  () => directBookingApi.list(orgId, 0, 200),
    enabled:  !!orgId,
  })

  // Blocked dates
  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked', propId],
    queryFn:  () => availabilityApi.getBlockedDates(propId),
    enabled:  !!propId,
  })

  // Pricing rules
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricing', propId],
    queryFn:  () => availabilityApi.getPricingRules(propId),
    enabled:  !!propId,
  })

  const qc = useQueryClient()
  const delBlock = useMutation({
    mutationFn: (id: string) => availabilityApi.unblockDate(propId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocked', propId] }); toast.success('Unblocked') },
  })
  const delPrice = useMutation({
    mutationFn: (id: string) => availabilityApi.deletePricingRule(propId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', propId] }); toast.success('Rule deleted') },
  })

  // Build sets for quick lookup
  const bookedDays = new Set<string>()
  ;(bookings?.content ?? []).filter(b => b.status !== 'CANCELLED').forEach(b => {
    datesInRange(b.checkInDate, b.checkOutDate).forEach(d => bookedDays.add(d))
  })

  const blockedDays = new Set<string>()
  blockedDates.forEach(b => {
    datesInRange(b.startDate, b.endDate).forEach(d => blockedDays.add(d))
  })

  const pricedDays = new Map<string, number>()
  pricingRules.forEach(r => {
    datesInRange(r.startDate, r.endDate).forEach(d => pricedDays.set(d, r.nightlyRate))
  })

  // Calendar grid
  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const todayStr = fmt(today)

  function getDayState(dayStr: string): DayState {
    if (dayStr < todayStr) return 'past'
    if (dayStr === todayStr) return 'today'
    if (bookedDays.has(dayStr)) return 'booked'
    if (blockedDays.has(dayStr)) return 'blocked'
    return 'available'
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  function handleDayClick(dayStr: string) {
    const state = getDayState(dayStr)
    if (state === 'past') return
    setModal({ date: dayStr })
  }

  const priceOnDay = (dayStr: string) => pricedDays.get(dayStr)
  const baseRate   = property?.baseNightlyRate

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage availability and pricing for each date</p>
        </div>
        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select value={propId} onChange={e => setSelectedProp(e.target.value)}
              className="input-base text-sm py-1.5 pr-8 appearance-none">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view==='calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Calendar
            </button>
            <button onClick={() => setView('rules')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view==='rules' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Rules
            </button>
          </div>
        </div>
      </div>

      {/* Base rate info */}
      {property && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <Info size={14} className="text-blue-600 flex-shrink-0" />
          <span className="text-blue-700">
            Base nightly rate: <strong>${baseRate ?? '—'}</strong>
            {!baseRate && ' — Set a base rate in Properties → Edit to enable pricing.'}
            &nbsp;Click any date to block it or set a custom rate.
          </span>
        </div>
      )}

      {!propId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Add a property first to manage its calendar.
        </div>
      )}

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {[...Array(firstDayOfWeek)].map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day    = i + 1
                const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const state  = getDayState(dayStr)
                const price  = priceOnDay(dayStr)
                const isPast = state === 'past'

                return (
                  <button key={day} onClick={() => handleDayClick(dayStr)}
                    disabled={isPast}
                    title={
                      state === 'blocked' ? 'Blocked — click to manage' :
                      state === 'booked'  ? 'Booked' :
                      price ? `$${price}/night` :
                      baseRate ? `$${baseRate}/night (base)` :
                      'Click to block or set price'
                    }
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg relative transition-all text-xs cursor-pointer ${
                      isPast                  ? 'text-gray-300 cursor-default' :
                      state === 'booked'      ? 'bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200' :
                      state === 'blocked'     ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                      state === 'today'       ? 'bg-gray-900 text-white font-bold ring-2 ring-primary-500 ring-offset-1' :
                                               'hover:bg-primary-50 hover:text-primary-700 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{day}</span>
                    {price && !isPast && (
                      <span className="text-[9px] leading-none mt-0.5 opacity-80">
                        ${price}
                      </span>
                    )}
                    {!price && baseRate && !isPast && state === 'available' && (
                      <span className="text-[9px] leading-none mt-0.5 opacity-40">
                        ${baseRate}
                      </span>
                    )}
                    {state === 'blocked' && (
                      <Ban size={8} className="mt-0.5 opacity-70" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              {[
                { color: 'bg-white border border-gray-200', label: 'Available' },
                { color: 'bg-blue-100',                    label: 'Booked' },
                { color: 'bg-red-100',                     label: 'Blocked' },
                { color: 'bg-gray-900',                    label: 'Today' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  {label}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-primary-600">
                <DollarSign size={11} /> Rate shown on each date
              </div>
            </div>
          </div>

          {/* Right panel — upcoming stays + pricing */}
          <div className="space-y-4">
            {/* Quick add buttons */}
            {propId && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setModal({ date: todayStr })}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors">
                    <Ban size={14} /> Block today
                  </button>
                  <button onClick={() => setModal({ date: todayStr })}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors">
                    <DollarSign size={14} /> Add pricing rule
                  </button>
                </div>
              </div>
            )}

            {/* This month's stays */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={13} className="text-primary-500" /> Reservations this month
              </h3>
              {(bookings?.content ?? [])
                .filter(b => b.status !== 'CANCELLED' &&
                  (b.checkInDate.startsWith(`${year}-${String(month+1).padStart(2,'0')}`) ||
                   b.checkOutDate.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)))
                .length === 0 ? (
                <p className="text-xs text-gray-400">No reservations this month</p>
              ) : (
                <div className="space-y-2">
                  {(bookings?.content ?? [])
                    .filter(b => b.status !== 'CANCELLED' &&
                      (b.checkInDate.startsWith(`${year}-${String(month+1).padStart(2,'0')}`) ||
                       b.checkOutDate.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)))
                    .map(b => (
                      <div key={b.id} className="p-2.5 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{b.guestName}</p>
                        <p className="text-xs text-gray-500">{b.checkInDate} → {b.checkOutDate}</p>
                        {b.totalAmount && <p className="text-xs text-green-600 font-medium">${b.totalAmount}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Rules view
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Blocked date ranges */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ban size={14} className="text-red-500" /> Blocked date ranges
            </h3>
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-400">No blocked dates</p>
            ) : (
              <div className="space-y-2">
                {blockedDates.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.startDate} → {b.endDate}</p>
                      {b.reason && <p className="text-xs text-gray-500">{b.reason}</p>}
                    </div>
                    <button onClick={() => delBlock.mutate(b.id)}
                      disabled={delBlock.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing rules */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-green-500" /> Pricing rules
            </h3>
            {pricingRules.length === 0 ? (
              <p className="text-sm text-gray-400">No custom pricing rules — base rate applies to all dates</p>
            ) : (
              <div className="space-y-2">
                {pricingRules.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div>
                      {r.name && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{r.name}</p>}
                      <p className="text-sm font-medium text-gray-900">
                        ${r.nightlyRate}/night
                        {r.minStayNights > 1 && <span className="text-xs text-gray-500 ml-1">· {r.minStayNights} night min</span>}
                      </p>
                      <p className="text-xs text-gray-500">{r.startDate} → {r.endDate}</p>
                    </div>
                    <button onClick={() => delPrice.mutate(r.id)}
                      disabled={delPrice.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date management modal */}
      {modal && propId && (
        <DayManageModal
          propertyId={propId}
          date={modal.date}
          onClose={() => setModal(null)}
          blockedDates={blockedDates}
          pricingRules={pricingRules}
        />
      )}
    </div>
  )
}
