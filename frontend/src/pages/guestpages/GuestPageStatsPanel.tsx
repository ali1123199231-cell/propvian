import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { parseISO } from 'date-fns'
import { guestPagesApi } from '@/api/guestPages'
import type { GuestPage } from '@/types/guestPage'

// Single series, so one hue and no legend: the chart title names what is plotted
const BAR = '#6366f1'
const BAR_ACTIVE = '#818cf8'
const GRID = '#e5e7eb'
const AXIS_TEXT = '#6b7280'

// Labels live under stats.sources.<source>
const SOURCES = ['NFC', 'QR', 'LINK'] as const

export function GuestPageStatsPanel({ orgId, propertyId, page }: { orgId: string; propertyId: string; page: GuestPage }) {
  const { t, i18n } = useTranslation('guestpage')
  const [days, setDays] = useState(30)
  // Month and weekday names in the host's language, without shipping date-fns locales
  const fmt = useMemo(() => {
    const short = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })
    const long = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })
    return { short: (d: string) => short.format(parseISO(d)), long: (d: string) => long.format(parseISO(d)) }
  }, [i18n.language])
  const { data: stats, isLoading } = useQuery({
    queryKey: ['guest-page-stats', orgId, propertyId, days],
    queryFn: () => guestPagesApi.stats(orgId, propertyId, days),
    enabled: !!orgId,
  })

  if (isLoading || !stats) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  const tiles = [
    { label: t('stats.views'), value: stats.views },
    { label: t('stats.wifiCopies'), value: stats.wifiCopies },
    { label: t('stats.bookDirectClicks'), value: stats.bookDirectClicks, muted: !page.bookDirectEnabled },
    { label: t('stats.contactTaps'), value: stats.contactClicks },
  ]
  const sourceTotal = Object.values(stats.viewsBySource).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <select className="input-base w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('stats.range')}>
          {[7, 30, 90].map((n) => <option key={n} value={n}>{t('stats.lastDays', { count: n })}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="card p-5">
            <p className="text-sm text-gray-500">{tile.label}</p>
            <p className={tile.muted ? 'text-3xl font-semibold text-gray-300' : 'text-3xl font-semibold text-gray-900'}>{tile.value.toLocaleString(i18n.language)}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gray-900">{t('stats.howOpened')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SOURCES.map((k) => (
            <div key={k} className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.viewsBySource[k].toLocaleString(i18n.language)}</p>
              <p className="text-sm text-gray-600">{t(`stats.sources.${k}`)}</p>
              <p className="text-xs text-gray-400">{t('stats.shareOfViews', { pct: sourceTotal ? Math.round((stats.viewsBySource[k] / sourceTotal) * 100) : 0 })}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-gray-900">{t('stats.perDay')}</h2>
        <p className="mb-4 text-sm text-gray-500">{t('stats.dedupe')}</p>
        {stats.views === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">{t('stats.empty')}</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                       tickFormatter={fmt.short} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#eef2ff' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as { date: string; views: number }
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
                        <p className="text-gray-500">{fmt.long(row.date)}</p>
                        <p className="font-semibold text-gray-900">{t('stats.viewCount', { count: row.views })}</p>
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
          <summary className="cursor-pointer text-gray-500">{t('stats.asTable')}</summary>
          <table className="mt-2 w-full max-w-xs text-sm">
            <tbody>
              {stats.daily.filter((d) => d.views > 0).map((d) => (
                <tr key={d.date} className="border-b border-gray-100"><td className="py-1 text-gray-600">{fmt.long(d.date)}</td><td className="py-1 text-right tabular-nums">{d.views}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </div>
  )
}
