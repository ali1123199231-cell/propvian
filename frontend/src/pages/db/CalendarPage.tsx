import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Calendar, DollarSign, Ban,
  Loader2, X, Trash2, Info, Building2, CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { directBookingApi } from '@/api/directBooking'
import { availabilityApi } from '@/api/availability'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'USD', symbol: '$',   label: 'USD – US Dollar' },
  { code: 'EUR', symbol: '€',   label: 'EUR – Euro' },
  { code: 'GBP', symbol: '£',   label: 'GBP – British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  label: 'AUD – Australian Dollar' },
  { code: 'CHF', symbol: 'Fr',  label: 'CHF – Swiss Franc' },
  { code: 'JPY', symbol: '¥',   label: 'JPY – Japanese Yen' },
  { code: 'AED', symbol: 'AED', label: 'AED – UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR – Saudi Riyal' },
  { code: 'TRY', symbol: '₺',   label: 'TRY – Turkish Lira' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN – Mexican Peso' },
  { code: 'BRL', symbol: 'R$',  label: 'BRL – Brazilian Real' },
  { code: 'INR', symbol: '₹',   label: 'INR – Indian Rupee' },
  { code: 'SGD', symbol: 'S$',  label: 'SGD – Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', label: 'NZD – New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R',   label: 'ZAR – South African Rand' },
]

function currencySymbol(code?: string) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? '$'
}

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
function nightsBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
}
function fmtLabel(d: string) {
  return parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type DayState = 'available' | 'blocked' | 'booked' | 'today' | 'past'

// ── Main calendar page ────────────────────────────────────────────────────────

export function CalendarPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const today = new Date()

  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedProp, setSelectedProp] = useState<string>('')
  const [view, setView]   = useState<'calendar' | 'rules'>('calendar')

  // Range selection
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selEnd, setSelEnd]     = useState<string | null>(null)
  const [hoverDay, setHoverDay] = useState<string | null>(null)
  const [rangePrice, setRangePrice] = useState<string>('')

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: propsData } = useQuery({
    queryKey: ['properties', orgId],
    queryFn:  () => propertiesApi.list(orgId, 0, 100),
    enabled:  !!orgId,
  })
  const properties = propsData?.content ?? []
  const propId = selectedProp || properties[0]?.id || ''
  const property = properties.find(p => p.id === propId)

  const { data: bookings } = useQuery({
    queryKey: ['direct-bookings', orgId, 'all'],
    queryFn:  () => directBookingApi.list(orgId, 0, 200),
    enabled:  !!orgId,
  })

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked', propId],
    queryFn:  () => availabilityApi.getBlockedDates(propId),
    enabled:  !!propId,
  })

  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricing', propId],
    queryFn:  () => availabilityApi.getPricingRules(propId),
    enabled:  !!propId,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────

  const qc = useQueryClient()

  const blockMut = useMutation({
    mutationFn: (d: { startDate: string; endDate: string }) =>
      availabilityApi.blockDates(propId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked', propId] })
      toast.success('Dates closed')
      clearSelection()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const unblockMut = useMutation({
    mutationFn: (id: string) => availabilityApi.unblockDate(propId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocked', propId] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const priceMut = useMutation({
    mutationFn: (d: { startDate: string; endDate: string; nightlyRate: number }) =>
      availabilityApi.createPricingRule(propId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', propId] })
      toast.success('Price saved')
      setRangePrice('')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const delBlock = useMutation({
    mutationFn: (id: string) => availabilityApi.unblockDate(propId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocked', propId] }); toast.success('Dates opened') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const delPrice = useMutation({
    mutationFn: (id: string) => availabilityApi.deletePricingRule(propId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', propId] }); toast.success('Rule deleted') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  // ── Day lookup sets ───────────────────────────────────────────────────────

  const bookedDays = new Set<string>()
  ;(bookings?.content ?? []).filter(b => b.status === 'CONFIRMED').forEach(b => {
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

  // ── Calendar grid helpers ─────────────────────────────────────────────────

  const daysInMonth    = new Date(year, month + 1, 0).getDate()
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

  // ── Selection helpers ─────────────────────────────────────────────────────

  function clearSelection() {
    setSelStart(null)
    setSelEnd(null)
    setRangePrice('')
  }

  function handleDayClick(dayStr: string) {
    if (getDayState(dayStr) === 'past') return
    if (!selStart || selEnd) {
      setSelStart(dayStr)
      setSelEnd(null)
      setRangePrice('')
    } else if (dayStr === selStart) {
      // clicking the same day completes a single-day selection
      setSelEnd(dayStr)
    } else if (dayStr < selStart) {
      setSelStart(dayStr)
      setSelEnd(selStart)
    } else {
      setSelEnd(dayStr)
    }
  }

  function handleOpenDates() {
    if (!selStart || !selEnd) return
    const overlapping = blockedDates.filter(b =>
      b.startDate <= selEnd && b.endDate >= selStart
    )
    if (overlapping.length === 0) {
      toast('No closed dates in this range')
      return
    }
    Promise.all(overlapping.map(b => unblockMut.mutateAsync(b.id))).then(() => {
      toast.success('Dates opened')
      clearSelection()
    })
  }

  function handleCloseDates() {
    if (!selStart || !selEnd) return
    blockMut.mutate({ startDate: selStart, endDate: selEnd })
  }

  function handleSetPrice() {
    if (!selStart || !selEnd || !rangePrice) return
    const rate = Number(rangePrice)
    if (isNaN(rate) || rate < 1) { toast.error('Enter a valid rate'); return }
    priceMut.mutate({ startDate: selStart, endDate: selEnd, nightlyRate: rate })
  }

  const effectiveEnd = selEnd ?? (selStart && hoverDay && hoverDay >= selStart ? hoverDay : null)
  const baseRate = property?.baseNightlyRate
  const sym = currencySymbol(property?.currency)
  const currencyCode = property?.currency ?? 'USD'
  const rangeNights = selStart && selEnd ? nightsBetween(selStart, selEnd) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          {property && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 size={13} className="text-primary-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-primary-700">{property.name}</span>
            </div>
          )}
          <p className="text-gray-400 text-sm mt-0.5">
            {selStart && !selEnd
              ? 'Now click an end date to complete the range'
              : 'Click a date, then click another to select a range'}
          </p>
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
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Calendar
            </button>
            <button onClick={() => setView('rules')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'rules' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Rules
            </button>
          </div>
        </div>
      </div>

      {/* Base rate hint */}
      {property && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <Info size={14} className="text-blue-600 flex-shrink-0" />
          <span className="text-blue-700">
            Base nightly rate: <strong>{sym}{baseRate ?? '—'}</strong> <span className="text-blue-500">({currencyCode})</span>
            {!baseRate && ' — Set a base rate in Properties → Edit to enable pricing.'}
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

          {/* ── Calendar grid ───────────────────────────────────────────── */}
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

            {/* Day-of-week headers */}
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
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const state  = getDayState(dayStr)
                const price  = pricedDays.get(dayStr)
                const isPast = state === 'past'

                const isSelStart = dayStr === selStart
                const isSelEnd   = dayStr === selEnd
                const isSelected = isSelStart || isSelEnd
                const isInRange  = !!(selStart && effectiveEnd && dayStr > selStart && dayStr < effectiveEnd)

                return (
                  <button key={day}
                    onClick={() => handleDayClick(dayStr)}
                    onMouseEnter={() => { if (!isPast) setHoverDay(dayStr) }}
                    onMouseLeave={() => setHoverDay(null)}
                    disabled={isPast}
                    title={
                      state === 'blocked' ? 'Closed' :
                      state === 'booked'  ? 'Booked' :
                      price ? `${sym}${price}/night` :
                      baseRate ? `${sym}${baseRate}/night (base)` : ''
                    }
                    className={[
                      'aspect-square flex flex-col items-center justify-center transition-all text-xs',
                      // range-in-between cells lose their border-radius so they look connected
                      isInRange ? 'rounded-none' : 'rounded-lg',
                      isPast      ? 'text-gray-300 cursor-default' :
                      isSelected  ? 'bg-primary-600 text-white font-bold ring-2 ring-primary-400 ring-offset-1 z-10 rounded-lg' :
                      isInRange   ? 'bg-primary-100 text-primary-800 cursor-pointer' :
                      state === 'booked'  ? 'bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 cursor-pointer' :
                      state === 'blocked' ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer' :
                      state === 'today'   ? 'bg-gray-900 text-white font-bold ring-2 ring-primary-500 ring-offset-1 cursor-pointer' :
                                           'hover:bg-primary-50 hover:text-primary-700 text-gray-700 cursor-pointer',
                    ].join(' ')}
                  >
                    <span className="font-medium">{day}</span>
                    {price && !isPast && !isSelected && (
                      <span className="text-[9px] leading-none mt-0.5 opacity-80">{sym}{price}</span>
                    )}
                    {!price && baseRate && !isPast && state === 'available' && !isSelected && !isInRange && (
                      <span className="text-[9px] leading-none mt-0.5 opacity-40">{sym}{baseRate}</span>
                    )}
                    {state === 'blocked' && !isSelected && !isInRange && (
                      <Ban size={8} className="mt-0.5 opacity-70" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              {[
                { color: 'bg-white border border-gray-200', label: 'Open' },
                { color: 'bg-red-100',                      label: 'Closed' },
                { color: 'bg-blue-100',                     label: 'Booked' },
                { color: 'bg-gray-900',                     label: 'Today' },
                { color: 'bg-primary-600',                  label: 'Selected' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Range action panel — appears once a start date is picked */}
            {propId && selStart && (
              <div className="bg-white rounded-xl border-2 border-primary-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {selEnd ? (
                      <>
                        <p className="text-base font-bold text-gray-900">
                          {fmtLabel(selStart)}{selStart !== selEnd ? ` – ${fmtLabel(selEnd)}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {rangeNights === 0 ? '1 day' : `${rangeNights} night${rangeNights !== 1 ? 's' : ''}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-bold text-gray-900">{fmtLabel(selStart)}</p>
                        <p className="text-xs text-primary-600 mt-0.5 animate-pulse">Pick an end date…</p>
                      </>
                    )}
                  </div>
                  <button onClick={clearSelection}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>

                {selEnd && (
                  <div className="space-y-2.5">
                    {/* Open */}
                    <button
                      onClick={handleOpenDates}
                      disabled={unblockMut.isPending || blockMut.isPending}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-50">
                      {unblockMut.isPending
                        ? <Loader2 size={15} className="animate-spin" />
                        : <CheckCircle size={15} />}
                      Open dates
                    </button>

                    {/* Close */}
                    <button
                      onClick={handleCloseDates}
                      disabled={blockMut.isPending || unblockMut.isPending}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100 text-sm font-bold transition-colors disabled:opacity-50">
                      {blockMut.isPending
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Ban size={15} />}
                      Close dates
                    </button>

                    {/* Price */}
                    <div className="pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Price per night</p>
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                          {currencyCode}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                          <input
                            type="number"
                            min="1"
                            value={rangePrice}
                            onChange={e => setRangePrice(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSetPrice()}
                            placeholder={baseRate ? String(baseRate) : '150'}
                            className="input-base text-sm pl-7 w-full"
                          />
                        </div>
                        <button
                          onClick={handleSetPrice}
                          disabled={!rangePrice || priceMut.isPending}
                          className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                          {priceMut.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Closed dates — always visible with quick-open buttons */}
            {propId && blockedDates.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Ban size={13} className="text-red-500" /> Closed dates
                </h3>
                <div className="space-y-1.5">
                  {blockedDates.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 tabular-nums">
                          {fmtLabel(b.startDate)}{b.startDate !== b.endDate ? ` – ${fmtLabel(b.endDate)}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => delBlock.mutate(b.id)}
                        disabled={delBlock.isPending}
                        title="Open these dates"
                        className="ml-2 flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                        <X size={11} />
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reservations this month */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={13} className="text-primary-500" /> Reservations this month
              </h3>
              {(bookings?.content ?? [])
                .filter(b => b.status === 'CONFIRMED' &&
                  (b.checkInDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) ||
                   b.checkOutDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)))
                .length === 0 ? (
                <p className="text-xs text-gray-400">No reservations this month</p>
              ) : (
                <div className="space-y-2">
                  {(bookings?.content ?? [])
                    .filter(b => b.status === 'CONFIRMED' &&
                      (b.checkInDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) ||
                       b.checkOutDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)))
                    .map(b => (
                      <div key={b.id} className="p-2.5 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{b.guestName}</p>
                        <p className="text-xs text-gray-500">{b.checkInDate} → {b.checkOutDate}</p>
                        {b.totalAmount && <p className="text-xs text-green-600 font-medium">{sym}{b.totalAmount}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ── Rules view ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ban size={14} className="text-red-500" /> Closed date ranges
            </h3>
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-400">No closed dates</p>
            ) : (
              <div className="space-y-2">
                {blockedDates.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fmtLabel(b.startDate)}{b.startDate !== b.endDate ? ` – ${fmtLabel(b.endDate)}` : ''}
                      </p>
                      {b.reason && <p className="text-xs text-gray-500">{b.reason}</p>}
                    </div>
                    <button onClick={() => delBlock.mutate(b.id)} disabled={delBlock.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                        {sym}{r.nightlyRate}/night
                        {r.minStayNights > 1 && <span className="text-xs text-gray-500 ml-1">· {r.minStayNights} night min</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fmtLabel(r.startDate)}{r.startDate !== r.endDate ? ` – ${fmtLabel(r.endDate)}` : ''}
                      </p>
                    </div>
                    <button onClick={() => delPrice.mutate(r.id)} disabled={delPrice.isPending}
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
    </div>
  )
}
