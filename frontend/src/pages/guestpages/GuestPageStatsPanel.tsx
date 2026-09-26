import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { guestPagesApi } from '@/api/guestPages'
import type { GuestPage } from '@/types/guestPage'

// Single series, so one hue and no legend: the chart title names what is plotted
const BAR = '#6366f1'
const BAR_ACTIVE = '#818cf8'
const GRID = '#e5e7eb'
const AXIS_TEXT = '#6b7280'

const SOURCE_LABELS: Record<'NFC' | 'QR' | 'LINK', string> = {
  NFC: 'Tapped an NFC tag',
  QR: 'Scanned a printed QR code',
  LINK: 'Opened the link',
}

export function GuestPageStatsPanel({ orgId, propertyId, page }: { orgId: string; propertyId: string; page: GuestPage }) {
  const [days, setDays] = useState(30)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['guest-page-stats', orgId, propertyId, days],
    queryFn: () => guestPagesApi.stats(orgId, propertyId, days),
    enabled: !!orgId,
  })

  if (isLoading || !stats) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  const tiles = [
    { label: 'Page views', value: stats.views },
    { label: 'WiFi passwords copied', value: stats.wifiCopies },
    { label: 'Book-direct clicks', value: stats.bookDirectClicks, muted: !page.bookDirectEnabled },
    { label: 'Contact taps', value: stats.contactClicks },
  ]
  const sourceTotal = Object.values(stats.viewsBySource).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <select className="input-base w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Time range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <p className="text-sm text-gray-500">{t.label}</p>
            <p className={t.muted ? 'text-3xl font-semibold text-gray-300' : 'text-3xl font-semibold text-gray-900'}>{t.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gray-900">How guests opened it</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(SOURCE_LABELS) as (keyof typeof SOURCE_LABELS)[]).map((k) => (
            <div key={k} className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.viewsBySource[k].toLocaleString()}</p>
              <p className="text-sm text-gray-600">{SOURCE_LABELS[k]}</p>
              <p className="text-xs text-gray-400">{sourceTotal ? Math.round((stats.viewsBySource[k] / sourceTotal) * 100) : 0}% of views</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-gray-900">Page views per day</h2>
        <p className="mb-4 text-sm text-gray-500">Repeat opens by the same guest within a minute count once.</p>
        {stats.views === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No views yet. Put the sign or tag in the rental and they'll appear here.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                       tickFormatter={(d: string) => format(parseISO(d), 'd MMM')} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#eef2ff' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as { date: string; views: number }
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
                        <p className="text-gray-500">{format(parseISO(row.date), 'EEE d MMM')}</p>
                        <p className="font-semibold text-gray-900">{row.views} {row.views === 1 ? 'view' : 'views'}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="views" fill={BAR} activeBar={{ fill: BAR_ACTIVE }} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-500">Show as table</summary>
          <table className="mt-2 w-full max-w-xs text-sm">
            <tbody>
              {stats.daily.filter((d) => d.views > 0).map((d) => (
                <tr key={d.date} className="border-b border-gray-100"><td className="py-1 text-gray-600">{format(parseISO(d.date), 'EEE d MMM')}</td><td className="py-1 text-right tabular-nums">{d.views}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </div>
  )
}
